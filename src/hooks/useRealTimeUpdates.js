import { useEffect, useState, useCallback } from 'react'
import useWebSocket from 'react-use-websocket'

const SOCKET_URL = 'ws://localhost:8000/ws'

export function useRealTimeUpdates(userId) {
  const [data, setData] = useState({
    events: [],
    online_users: [],
    queue: [],
    timers: {},
    user_status: null,
    total_connected: 0,
    interaction_timeout: 0,
    was_moved_to_queue: false
  })

  const [isConnected, setIsConnected] = useState(false)
  const [localTimer, setLocalTimer] = useState(0)

  const { sendMessage, lastMessage, readyState } = useWebSocket(SOCKET_URL, {
    queryParams: { user_id: userId },
    onOpen: () => {
      console.log('Conexão WebSocket aberta')
      setIsConnected(true)
    },
    onClose: () => {
      console.log('Conexão WebSocket fechada')
      setIsConnected(false)
    },
    onError: error => {
      console.error('Erro na conexão WebSocket:', error)
      setIsConnected(false)
    },
    shouldReconnect: closeEvent => true,
    reconnectInterval: 3000,
    reconnectAttempts: 10,
    share: false // Não compartilhar conexão entre instâncias
  })

  // Processar mensagens recebidas
  useEffect(() => {
    if (lastMessage !== null) {
      try {
        const updates = JSON.parse(lastMessage.data)
        setData(prevData => ({
          ...prevData,
          ...updates,
          was_moved_to_queue: updates.was_moved_to_queue || false
        }))

        // Atualiza o timer local se receber um novo valor
        if (updates.interaction_timeout !== undefined) {
          setLocalTimer(updates.interaction_timeout)
        }
      } catch (e) {
        console.error('Erro ao analisar mensagem WebSocket:', e)
      }
    }
  }, [lastMessage])

  // Timer local para atualizações suaves
  useEffect(() => {
    let interval
    if (isConnected && data.user_status === 'active' && localTimer > 0) {
      interval = setInterval(() => {
        setLocalTimer(prev => Math.max(0, prev - 1))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isConnected, data.user_status, localTimer])

  // Enviar heartbeat
  useEffect(() => {
    let heartbeatInterval
    if (isConnected) {
      heartbeatInterval = setInterval(() => {
        sendMessage('heartbeat')
      }, 15000)
    }
    return () => clearInterval(heartbeatInterval)
  }, [isConnected, sendMessage])

  // Função auxiliar para verificar status do usuário
  const getUserStatus = useCallback(() => {
    if (data.user_status === 'active') {
      return {
        type: 'active',
        message: 'Ativo - Você pode interagir com os eventos',
        timeLeft: localTimer
      }
    } else if (data.user_status?.startsWith('queue_')) {
      const position = data.user_status.split('_')[1]
      return {
        type: 'queue',
        message: `Na fila - Posição ${position}`,
        position: parseInt(position)
      }
    }
    return {
      type: 'disconnected',
      message: 'Desconectado'
    }
  }, [data.user_status, localTimer])

  return {
    ...data,
    isConnected,
    userStatus: getUserStatus(),
    sendMessage,
    isActive: data.user_status === 'active',
    timeLeft: localTimer,
    wasMovedToQueue: data.was_moved_to_queue,
    // Helpers adicionais
    isInQueue: data.user_status?.startsWith('queue_'),
    queuePosition: data.user_status?.startsWith('queue_')
      ? parseInt(data.user_status.split('_')[1])
      : null
  }
}

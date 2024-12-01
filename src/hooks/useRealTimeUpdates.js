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
    interaction_timeout: 30,
    was_moved_to_queue: false
  })

  const [isConnected, setIsConnected] = useState(false)
  const [interactionTimer, setInteractionTimer] = useState(30)
  const [wasMovedToQueue, setWasMovedToQueue] = useState(false)

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
    reconnectAttempts: 10
  })

  // Processar mensagens recebidas
  useEffect(() => {
    if (lastMessage !== null) {
      try {
        const updates = JSON.parse(lastMessage.data)
        console.log('Received updates:', updates) // Debug

        // Verifica se o usuário foi movido para a fila
        const previousStatus = data.user_status
        const newStatus = updates.user_status

        if (previousStatus === 'active' && newStatus?.startsWith('queue_')) {
          setWasMovedToQueue(true)
          setTimeout(() => setWasMovedToQueue(false), 5000)
        }

        // Atualiza o timer com o valor do servidor
        if (typeof updates.interaction_timeout === 'number') {
          setInteractionTimer(updates.interaction_timeout)
        }

        setData(prevData => ({
          ...prevData,
          ...updates
        }))
      } catch (e) {
        console.error('Erro ao analisar mensagem WebSocket:', e)
      }
    }
  }, [lastMessage, data.user_status])

  // Enviar heartbeat periódico para manter a conexão ativa
  useEffect(() => {
    let heartbeatInterval
    if (isConnected) {
      heartbeatInterval = setInterval(() => {
        sendMessage('heartbeat')
      }, 1000) // Reduzido para 1 segundo para manter o timer atualizado
    }
    return () => clearInterval(heartbeatInterval)
  }, [isConnected, sendMessage])

  const getUserStatus = useCallback(() => {
    if (data.user_status === 'active') {
      return {
        type: 'active',
        message: 'Ativo - Você pode interagir com os eventos',
        timeLeft: interactionTimer
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
  }, [data.user_status, interactionTimer])

  return {
    ...data,
    isConnected,
    userStatus: getUserStatus(),
    sendMessage,
    isActive: data.user_status === 'active',
    timeLeft: interactionTimer,
    wasMovedToQueue,
    isInQueue: data.user_status?.startsWith('queue_'),
    queuePosition: data.user_status?.startsWith('queue_')
      ? parseInt(data.user_status.split('_')[1])
      : null
  }
}

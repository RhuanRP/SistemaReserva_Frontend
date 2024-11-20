import { useEffect, useState } from 'react'
import useWebSocket from 'react-use-websocket'

const SOCKET_URL = 'ws://localhost:8000/ws'

export function useRealTimeUpdates(userId) {
  const [data, setData] = useState({
    events: [],
    online_users: [],
    queue: [],
    timers: {}
  })

  const { sendMessage, lastMessage } = useWebSocket(SOCKET_URL, {
    queryParams: { user_id: userId },
    onOpen: () => console.log('Conexão WebSocket aberta'),
    onClose: () => console.log('Conexão WebSocket fechada'),
    shouldReconnect: () => true // Reconexão automática
  })

  useEffect(() => {
    if (lastMessage !== null) {
      try {
        const updates = JSON.parse(lastMessage.data)
        setData(updates)
      } catch (e) {
        console.error('Erro ao analisar mensagem WebSocket:', e)
      }
    }
  }, [lastMessage])

  return data
}

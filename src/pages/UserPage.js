import React, { useState } from 'react'
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates'
import styles from '../styles/UserPage.module.css'
import { v4 as uuidv4 } from 'uuid'

const UserPage = () => {
  // Gerar user_id único
  const [userId] = useState(() => {
    const existingUserId = localStorage.getItem('user_id')
    if (existingUserId) {
      return existingUserId
    } else {
      const newUserId = uuidv4()
      localStorage.setItem('user_id', newUserId)
      return newUserId
    }
  })

  const { events, online_users, queue, timers } = useRealTimeUpdates(userId)

  // Estado para mensagens de feedback
  const [feedback, setFeedback] = useState('')

  const handleReservation = async eventId => {
    try {
      const response = await fetch('http://localhost:8000/reservations/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_id: eventId,
          user_id: userId
        })
      })

      if (response.ok) {
        const data = await response.json()
        setFeedback(
          `Reserva criada com sucesso para o evento: ${data.event.name}`
        )
      } else {
        const error = await response.json()
        setFeedback(`Erro: ${error.detail}`)
      }
    } catch (error) {
      setFeedback('Erro ao realizar a reserva. Tente novamente mais tarde.')
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>Usuário - Sistema de Reserva de Eventos</h1>

      {/* Mensagem de Feedback */}
      {feedback && <div className={styles.feedback}>{feedback}</div>}

      <div className={styles.section}>
        <h2>Usuários Online</h2>
        <p>Total: {online_users.length}</p>
      </div>

      <div className={styles.section}>
        <h2>Fila de Espera</h2>
        <ul className={styles.list}>
          {queue.map((user, index) => (
            <li key={index}>{user}</li>
          ))}
        </ul>
      </div>

      <div className={styles.section}>
        <h2>Eventos Disponíveis</h2>
        <div className={styles.gridContainer}>
          {events.map(event => (
            <div key={event.id} className={styles.card}>
              <h3>{event.name}</h3>
              <p>Vagas disponíveis: {event.available_slots}</p>
              <button
                className={styles.button}
                onClick={() => handleReservation(event.id)}
              >
                Reservar
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h2>Timers</h2>
        {Object.entries(timers).map(([userId, timer]) => {
          const expiresAt = new Date(timer.expires_at)
          const timeLeft = Math.max(0, (expiresAt - new Date()) / 1000)
          return (
            <p key={userId}>
              Usuário {userId}: {Math.floor(timeLeft)}s restantes
            </p>
          )
        })}
      </div>
    </div>
  )
}

export default UserPage

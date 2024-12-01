import React, { useState, useEffect } from 'react'
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates'
import styles from '../styles/UserPage.module.css'
import { v4 as uuidv4 } from 'uuid'

const ConfirmationModal = React.memo(
  ({
    modalTimer,
    name,
    setName,
    phone,
    setPhone,
    handleConfirmReservation,
    handleCloseModal
  }) => (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <div
            className={`${styles.modalTimer} ${
              modalTimer < 30 ? styles.warning : ''
            }`}
          >
            Tempo restante: {modalTimer}s
            <div
              className={styles.modalTimerBar}
              style={{ width: `${(modalTimer / 120) * 100}%` }}
            />
          </div>
          <h2 className={styles.modalTitle}>Confirme sua Reserva</h2>
          <p className={styles.modalSubtitle}>
            Preencha seus dados para finalizar a reserva
          </p>
        </div>
        <div className={styles.modalForm}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Nome Completo</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className={styles.input}
              placeholder="Digite seu nome completo"
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Telefone</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className={styles.input}
              placeholder="(00) 00000-0000"
            />
          </div>
          <div className={styles.modalButtons}>
            <button
              className={styles.confirmButton}
              onClick={handleConfirmReservation}
            >
              Confirmar Reserva
            </button>
            <button className={styles.cancelButton} onClick={handleCloseModal}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
)

// Mova o UserStatus para fora do componente principal e use React.memo
const UserStatus = React.memo(({ isActive, timeLeft, userStatus }) => {
  if (isActive && timeLeft > 0) {
    const timerColor = timeLeft < 10 ? '#ff4444' : '#4CAF50'
    return (
      <div
        className={`${styles.statusBar} ${timeLeft < 10 ? styles.warning : ''}`}
      >
        <div className={styles.statusContent}>
          <span className={styles.statusText}>
            {timeLeft > 0
              ? `Tempo para interagir: ${timeLeft}s`
              : 'Tempo esgotado!'}
          </span>
          <span className={styles.timer}>{userStatus.message}</span>
        </div>
        <div
          className={styles.timerBar}
          style={{
            width: `${(timeLeft / 30) * 100}%`,
            backgroundColor: timerColor
          }}
        />
      </div>
    )
  } else if (userStatus.type === 'queue') {
    return (
      <div className={styles.statusBar}>
        <div className={styles.statusContent}>
          <span className={styles.statusText}>{userStatus.message}</span>
          <div className={styles.queueInfo}>
            Aguarde sua vez... Posição: {userStatus.position}
          </div>
        </div>
      </div>
    )
  }
  return null
})

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

  const {
    events,
    online_users,
    queue,
    timers,
    user_status,
    interaction_timeout,
    was_moved_to_queue: wasMovedToQueue,
    isConnected,
    isActive,
    timeLeft,
    userStatus
  } = useRealTimeUpdates(userId)

  // Estado para mensagens de feedback
  const [feedback, setFeedback] = useState('')
  const [confirmingEvent, setConfirmingEvent] = useState(null) // Evento atual para confirmação
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  // Estado local para o timer
  const [localTimer, setLocalTimer] = useState(30)

  // Novo estado para controlar o timer do modal
  const [modalTimer, setModalTimer] = useState(120)
  const [modalTimerInterval, setModalTimerInterval] = useState(null)

  // Efeito para atualizar o timer local
  useEffect(() => {
    if (interaction_timeout > 0) {
      setLocalTimer(interaction_timeout)
    }
  }, [interaction_timeout])

  // Timer visual que atualiza a cada segundo
  useEffect(() => {
    let interval
    if (user_status === 'active' && localTimer > 0) {
      interval = setInterval(() => {
        setLocalTimer(prev => Math.max(0, prev - 1))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [user_status, localTimer])

  const handleReservation = async eventId => {
    try {
      // Primeiro, criar a reserva temporária
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
        // Se a reserva temporária for criada com sucesso, abrir o modal
        setConfirmingEvent(eventId)
        setModalTimer(120)

        // Inicia o timer do modal
        const interval = setInterval(() => {
          setModalTimer(prev => {
            if (prev <= 1) {
              clearInterval(interval)
              setConfirmingEvent(null)
              setModalTimer(120)
              return 0
            }
            return prev - 1
          })
        }, 1000)

        setModalTimerInterval(interval)
      } else {
        const error = await response.json()
        setFeedback(
          `Erro: ${error.detail || 'Não foi possível criar a reserva'}`
        )
      }
    } catch (error) {
      console.error('Erro ao criar reserva temporária:', error)
      setFeedback('Erro ao criar reserva. Tente novamente mais tarde.')
    }
  }

  // Limpa o intervalo quando o componente é desmontado ou o modal é fechado
  useEffect(() => {
    return () => {
      if (modalTimerInterval) {
        clearInterval(modalTimerInterval)
      }
    }
  }, [modalTimerInterval])

  // Atualiza a função de fechar o modal
  const handleCloseModal = () => {
    if (modalTimerInterval) {
      clearInterval(modalTimerInterval)
      setModalTimerInterval(null)
    }
    setConfirmingEvent(null)
    setModalTimer(120)
    setName('')
    setPhone('')
    setFeedback('')
  }

  // Atualiza a função de confirmar reserva
  const handleConfirmReservation = async () => {
    if (!name || !phone) {
      setFeedback('Por favor, preencha seu nome e telefone.')
      return
    }

    try {
      const response = await fetch(
        'http://localhost:8000/confirm-reservation/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            event_id: confirmingEvent,
            user_id: userId,
            name: name.trim(),
            phone: phone.replace(/\D/g, '')
          })
        }
      )

      const data = await response.json()

      if (response.ok) {
        handleCloseModal()
        setTimeout(() => {
          setFeedback('Reserva confirmada com sucesso!')
        }, 100)
      } else {
        setFeedback(`Erro: ${data.detail || 'Erro ao confirmar reserva'}`)
      }
    } catch (error) {
      console.error('Erro ao confirmar a reserva:', error)
      setFeedback('Erro ao confirmar a reserva. Tente novamente mais tarde.')
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>Sistema de Reserva de Eventos</h1>

      {/* Status de Conexão e UserStatus permanecem no topo */}
      <div
        className={`${styles.connectionStatus} ${
          isConnected ? styles.connected : styles.disconnected
        }`}
      >
        <span className={styles.statusDot} />
        {isConnected ? 'Conectado' : 'Reconectando...'}
      </div>
      <UserStatus
        isActive={isActive}
        timeLeft={timeLeft}
        userStatus={userStatus}
      />

      {/* Layout principal com grid */}
      <div className={styles.mainLayout}>
        {/* Coluna principal com eventos */}
        <div className={styles.mainContent}>
          <div className={styles.section}>
            <h2>Eventos Disponíveis</h2>
            <div className={styles.gridContainer}>
              {events.map(event => (
                <div key={event.id} className={styles.card}>
                  <h3>{event.name}</h3>
                  <p>Vagas disponíveis: {event.available_slots}</p>
                  <button
                    className={`${styles.button} ${
                      !isActive ? styles.buttonDisabled : ''
                    }`}
                    onClick={() => handleReservation(event.id)}
                    disabled={!isActive}
                    title={
                      !isActive
                        ? 'Você precisa estar ativo para fazer reservas'
                        : ''
                    }
                  >
                    {isActive ? 'Reservar' : 'Aguarde sua vez'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar direita */}
        <div className={styles.sidebar}>
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
        </div>
      </div>

      {/* Feedback de movimento para fila com animação */}
      {wasMovedToQueue && (
        <div
          className={`${styles.feedback} ${styles.warning} ${styles.slideIn}`}
        >
          <span className={styles.warningIcon}>⚠️</span>
          Você foi movido para o final da fila por inatividade.
        </div>
      )}

      {/* Mensagem de Feedback */}
      {feedback && <div className={styles.feedback}>{feedback}</div>}

      {/* Modal de confirmação */}
      {confirmingEvent && (
        <ConfirmationModal
          modalTimer={modalTimer}
          name={name}
          setName={setName}
          phone={phone}
          setPhone={setPhone}
          handleConfirmReservation={handleConfirmReservation}
          handleCloseModal={handleCloseModal}
        />
      )}
    </div>
  )
}

export default UserPage

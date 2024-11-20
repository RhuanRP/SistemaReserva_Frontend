import React, { useState } from 'react'
import axios from 'axios'
import styles from '../styles/AdminPage.module.css'

const API_URL = 'http://localhost:8000'

const AdminPage = () => {
  const [maxEvents, setMaxEvents] = useState(5)
  const [maxUsers, setMaxUsers] = useState(3)
  const [choiceTime, setChoiceTime] = useState(120)
  const [eventName, setEventName] = useState('')
  const [totalSlots, setTotalSlots] = useState(0)

  const updateConfig = async () => {
    try {
      await axios.post(`${API_URL}/admin/config/`, {
        max_events: maxEvents,
        max_users: maxUsers,
        choice_time: choiceTime
      })
      alert('Configuração atualizada com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar configuração', error)
      alert('Erro ao atualizar configuração')
    }
  }

  const createEvent = async () => {
    try {
      await axios.post(`${API_URL}/admin/events/`, {
        name: eventName,
        total_slots: totalSlots
      })
      alert('Evento criado com sucesso!')
    } catch (error) {
      console.error('Erro ao criar evento', error)
      alert('Erro ao criar evento')
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>
        Administrador - Sistema de Reserva de Eventos
      </h1>

      <div className={styles.formGroup}>
        <h2>Configuração do Sistema</h2>
        <label>Máximo de Eventos:</label>
        <input
          type="number"
          value={maxEvents}
          onChange={e => setMaxEvents(Number(e.target.value))}
        />
        <label>Máximo de Usuários Simultâneos:</label>
        <input
          type="number"
          value={maxUsers}
          onChange={e => setMaxUsers(Number(e.target.value))}
        />
        <label>Tempo de Escolha (segundos):</label>
        <input
          type="number"
          value={choiceTime}
          onChange={e => setChoiceTime(Number(e.target.value))}
        />
        <button className={styles.button} onClick={updateConfig}>
          Atualizar Configuração
        </button>
      </div>

      <div className={styles.formGroup}>
        <h2>Criar Novo Evento</h2>
        <label>Nome do Evento:</label>
        <input
          type="text"
          value={eventName}
          onChange={e => setEventName(e.target.value)}
        />
        <label>Total de Vagas:</label>
        <input
          type="number"
          value={totalSlots}
          onChange={e => setTotalSlots(Number(e.target.value))}
        />
        <button className={styles.button} onClick={createEvent}>
          Criar Evento
        </button>
      </div>
    </div>
  )
}

export default AdminPage

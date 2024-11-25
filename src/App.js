import React from 'react'
import UserPage from './pages/UserPage'
import AdminPage from './pages/AdminPage'
import './App.css'

function App() {
  const [menu, setMenu] = React.useState('Usuário')

  return (
    <div className="app-container">
      <header className="header">
        <h2 className="header-title">Menu</h2>
        <select
          className="menu-select"
          value={menu}
          onChange={e => setMenu(e.target.value)}
        >
          <option value="Usuário">Usuário</option>
          <option value="Administrador">Administrador</option>
        </select>
      </header>
      <main className="content">
        {menu === 'Usuário' ? <UserPage /> : <AdminPage />}
      </main>
    </div>
  )
}

export default App

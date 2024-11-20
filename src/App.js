import React from 'react'
import UserPage from './pages/UserPage'
import AdminPage from './pages/AdminPage'
import './App.css'

function App() {
  const [menu, setMenu] = React.useState('Usuário')

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h2 className="sidebar-title">Menu</h2>
        <select
          className="menu-select"
          value={menu}
          onChange={e => setMenu(e.target.value)}
        >
          <option value="Usuário">Usuário</option>
          <option value="Administrador">Administrador</option>
        </select>
      </aside>
      <main className="content">
        {menu === 'Usuário' ? <UserPage /> : <AdminPage />}
      </main>
    </div>
  )
}

export default App

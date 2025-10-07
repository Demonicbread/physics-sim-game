import React from 'react'

export default function Navbar({ setCurrentPage }) {
  const navStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 64,
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    background: 'rgba(0,0,0,0.6)',
    color: '#fff',
    zIndex: 50
  }

  return (
    <nav style={navStyle}>
      <div style={{ fontWeight: '700' }}>Physics Sim</div>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        <button onClick={() => setCurrentPage('home')} style={{ background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer' }}>Home</button>
        <button onClick={() => setCurrentPage('game')} style={{ background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer' }}>Game</button>
        <button onClick={() => setCurrentPage('leaderboard')} style={{ background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer' }}>Leaderboard</button>
        <button onClick={() => setCurrentPage('about')} style={{ background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer' }}>About</button>
      </div>
    </nav>
  )
}

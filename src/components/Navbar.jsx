import React from 'react'
import LanguageSelector from './LanguageSelector'

export default function Navbar({ setCurrentPage, currentLanguage, onLanguageChange }) {
  return (
    <nav>
      <div className="brand">
        <div className="logo"></div>
        Physics Sim
      </div>
      <div className="nav-actions">
        <LanguageSelector currentLanguage={currentLanguage} onLanguageChange={onLanguageChange} />
        <button onClick={() => setCurrentPage('home')} className="nav-link">
          Home
        </button>
        <button onClick={() => setCurrentPage('modes')} className="nav-link">
          Play
        </button>
        <button onClick={() => setCurrentPage('sandbox')} className="nav-link">
          Sandbox
        </button>
        <button onClick={() => setCurrentPage('leaderboard')} className="nav-link">
          Leaderboard
        </button>
        <button onClick={() => setCurrentPage('about')} className="nav-link">
          About
        </button>
      </div>
    </nav>
  )
}

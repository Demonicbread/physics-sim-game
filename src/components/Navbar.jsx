import React from 'react'

export default function Navbar({ setCurrentPage }) {
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 flex items-center px-6 bg-slate-950/80 backdrop-blur-md border-b border-white/10 z-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg"></div>
        <div className="font-extrabold text-xl bg-gradient-to-r from-purple-400 to-cyan-400 text-transparent bg-clip-text">
          Physics Sim
        </div>
      </div>
      <div className="ml-auto flex gap-2">
        <button 
          onClick={() => setCurrentPage('home')} 
          className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors font-semibold text-sm"
        >
          Home
        </button>
        <button 
          onClick={() => setCurrentPage('modes')} 
          className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors font-semibold text-sm"
        >
          Play
        </button>
        <button 
          onClick={() => setCurrentPage('sandbox')} 
          className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors font-semibold text-sm"
        >
          Sandbox
        </button>
        <button 
          onClick={() => setCurrentPage('leaderboard')} 
          className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors font-semibold text-sm"
        >
          Leaderboard
        </button>
        <button 
          onClick={() => setCurrentPage('about')} 
          className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors font-semibold text-sm"
        >
          About
        </button>
      </div>
    </nav>
  )
}

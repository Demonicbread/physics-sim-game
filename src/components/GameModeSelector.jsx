import React from 'react';

export default function GameModeSelector({ onSelectMode, onBack }) {
  const modes = [
    {
      id: 'sandbox',
      name: 'Sandbox Mode',
      icon: '🎨',
      description: 'Free play with unlimited resources',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'challenge',
      name: 'Challenge Mode',
      icon: '🎯',
      description: 'Complete objectives across 20 levels',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'survival',
      name: 'Survival Mode',
      icon: '🌊',
      description: 'Defend your core from endless waves',
      color: 'from-red-500 to-orange-500'
    },
    {
      id: 'collection',
      name: 'Collection Mode',
      icon: '🎯',
      description: 'Sort particles into matching zones',
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'reaction',
      name: 'Chain Reaction',
      icon: '⚡',
      description: 'Create explosive chain reactions',
      color: 'from-yellow-500 to-amber-500'
    }
  ];

  return (
    <div className="pt-16 py-12 min-h-screen text-white px-4">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={onBack}
          className="btn mb-6 bg-slate-700 hover:bg-slate-600"
        >
          ← Back to Home
        </button>

        <h2 className="text-5xl font-extrabold text-center mb-4 bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text tracking-tight">
          Select Game Mode
        </h2>
        <p className="text-center text-slate-300 mb-12">Choose your physics adventure</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className="card p-6 hover:scale-105 transition-all duration-300 text-left group cursor-pointer"
            >
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                {mode.icon}
              </div>
              <h3 className={`text-2xl font-bold mb-2 bg-gradient-to-r ${mode.color} text-transparent bg-clip-text`}>
                {mode.name}
              </h3>
              <p className="text-slate-400 text-sm">
                {mode.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

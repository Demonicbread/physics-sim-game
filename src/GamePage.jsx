import React from 'react';

console.log('🎮 GamePage component loaded!');

export default function GamePage({
  mode, setMode,
  gravity, setGravity,
  particleSize, setParticleSize,
  windForce, setWindForce,
  magnetStrength, setMagnetStrength,
  timeScale, setTimeScale,
  explosionPower, setExplosionPower,
  color, setColor,
  screenShake, setScreenShake,
  toolMode, setToolMode,
  colliderMode, setColliderMode,
  showStats,
  fps,
  particleCount,
  highScore,
  collidersRef,
  spawnParticles,
  stressTest,
  megaStressTest,
  clearWorld,
  simContainerRef,
  sceneRef,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  renderRef
}) {
  return (
    <div className="pt-20 pb-8 min-h-screen text-white px-4">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <h2 className="text-5xl font-extrabold text-center mb-8 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-transparent bg-clip-text tracking-tight drop-shadow-lg">
          PhysicsBox Sandbox
        </h2>

        {/* Main Toolbar */}
        <div className="card p-4 backdrop-blur-xl bg-slate-900/60 border-2 border-purple-500/30">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <select 
              value={mode} 
              onChange={(e) => setMode(e.target.value)} 
              className="px-4 py-2 bg-slate-800/90 text-white rounded-lg border-2 border-purple-500/50 hover:border-purple-400 transition-all font-semibold shadow-lg"
            >
              <option value="balls">Bouncing Balls</option>
              <option value="sand">Falling Sand</option>
              <option value="water">Water Drops</option>
              <option value="plasma">Plasma Energy</option>
              <option value="metal">Metal Chunks</option>
              <option value="explosive">Explosives</option>
            </select>
            <button onClick={() => spawnParticles((renderRef.current?.options?.width || 1000) / 2, 100, 1)} className="btn-primary px-6 py-2.5 shadow-xl hover:shadow-2xl">Add Particle</button>
            <button onClick={stressTest} className="btn-warning px-6 py-2.5 shadow-xl hover:shadow-2xl">Stress Test (500)</button>
            <button onClick={megaStressTest} className="btn-danger px-6 py-2.5 shadow-xl hover:shadow-2xl">MEGA (2000)</button>
            <button onClick={clearWorld} className="btn btn-ghost px-6 py-2.5 shadow-xl hover:shadow-2xl">Clear All</button>
          </div>
        </div>

        {/* Physics Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="control-group">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-wider text-purple-300 font-bold">Gravity</label>
              <span className="text-sm font-mono text-cyan-400 min-w-[3rem] text-right">{gravity.toFixed(1)}</span>
            </div>
            <input type="range" min="-2" max="3" step="0.1" value={gravity} onChange={(e) => setGravity(parseFloat(e.target.value))} className="w-full accent-purple-500" />
          </div>
          <div className="control-group">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-wider text-purple-300 font-bold">Size</label>
              <span className="text-sm font-mono text-cyan-400 min-w-[3rem] text-right">{particleSize}</span>
            </div>
            <input type="range" min="1" max="30" value={particleSize} onChange={(e) => setParticleSize(parseInt(e.target.value))} className="w-full accent-purple-500" />
          </div>
          <div className="control-group">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-wider text-purple-300 font-bold">Wind</label>
              <span className="text-sm font-mono text-cyan-400 min-w-[3rem] text-right">{windForce}</span>
            </div>
            <input type="range" min="-50" max="50" value={windForce} onChange={(e) => setWindForce(parseInt(e.target.value))} className="w-full accent-purple-500" />
          </div>
          <div className="control-group">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-wider text-purple-300 font-bold">Magnet</label>
              <span className="text-sm font-mono text-cyan-400 min-w-[3rem] text-right">{magnetStrength}</span>
            </div>
            <input type="range" min="-100" max="100" value={magnetStrength} onChange={(e) => setMagnetStrength(parseInt(e.target.value))} className="w-full accent-purple-500" />
          </div>
        </div>

        {/* Advanced Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="control-group">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-wider text-purple-300 font-bold">Time Scale</label>
              <span className="text-sm font-mono text-cyan-400 min-w-[3rem] text-right">{timeScale.toFixed(1)}</span>
            </div>
            <input type="range" min="0.1" max="3" step="0.1" value={timeScale} onChange={(e) => setTimeScale(parseFloat(e.target.value))} className="w-full accent-purple-500" />
          </div>
          <div className="control-group">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-wider text-purple-300 font-bold">Explosion</label>
              <span className="text-sm font-mono text-cyan-400 min-w-[3rem] text-right">{explosionPower}</span>
            </div>
            <input type="range" min="10" max="200" value={explosionPower} onChange={(e) => setExplosionPower(parseInt(e.target.value))} className="w-full accent-purple-500" />
          </div>
          <div className="control-group">
            <label className="block text-xs uppercase tracking-wider text-purple-300 font-bold mb-2">Color</label>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-full h-10 rounded-lg cursor-pointer border-2 border-purple-500/50" />
          </div>
          <div className="control-group flex items-center justify-center">
            <button onClick={() => setScreenShake(!screenShake)} className={`btn w-full ${screenShake ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-700 hover:bg-slate-600'} transition-all shadow-lg`}>
              {screenShake ? '✓ ' : ''}Screen Shake
            </button>
          </div>
        </div>

        {/* Tools & Colliders - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-5 backdrop-blur-xl bg-slate-900/60 border-2 border-purple-500/30">
            <h3 className="text-sm font-bold mb-3 text-purple-300 uppercase tracking-wider flex items-center gap-2">
              <span className="text-lg">🛠️</span> Tools
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setToolMode('none')} className={`btn ${toolMode === 'none' ? 'bg-gradient-to-r from-green-600 to-green-500 shadow-lg shadow-green-500/50' : 'bg-slate-700 hover:bg-slate-600'} transition-all`}>Normal</button>
              <button onClick={() => setToolMode('spray')} className={`btn ${toolMode === 'spray' ? 'bg-gradient-to-r from-green-600 to-green-500 shadow-lg shadow-green-500/50' : 'bg-blue-700 hover:bg-blue-600'} transition-all`}>Spray</button>
              <button onClick={() => setToolMode('gun')} className={`btn ${toolMode === 'gun' ? 'bg-gradient-to-r from-green-600 to-green-500 shadow-lg shadow-green-500/50' : 'bg-yellow-700 hover:bg-yellow-600'} transition-all`}>Particle Gun</button>
              <button onClick={() => setToolMode('explosion')} className={`btn ${toolMode === 'explosion' ? 'bg-gradient-to-r from-green-600 to-green-500 shadow-lg shadow-green-500/50' : 'bg-red-700 hover:bg-red-600'} transition-all`}>Exploder</button>
            </div>
          </div>

          <div className="card p-5 backdrop-blur-xl bg-slate-900/60 border-2 border-cyan-500/30">
            <h3 className="text-sm font-bold mb-3 text-cyan-300 uppercase tracking-wider flex items-center gap-2">
              <span className="text-lg">⚙️</span> Colliders
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-2">
              <button onClick={() => setColliderMode('none')} className={`btn text-sm ${colliderMode === 'none' ? 'bg-gradient-to-r from-green-600 to-green-500 shadow-lg shadow-green-500/50' : 'bg-slate-700 hover:bg-slate-600'} transition-all`}>None</button>
              <button onClick={() => setColliderMode('platform')} className={`btn text-sm ${colliderMode === 'platform' ? 'bg-gradient-to-r from-green-600 to-green-500 shadow-lg shadow-green-500/50' : 'bg-amber-700 hover:bg-amber-600'} transition-all`}>Platform</button>
              <button onClick={() => setColliderMode('bouncer')} className={`btn text-sm ${colliderMode === 'bouncer' ? 'bg-gradient-to-r from-green-600 to-green-500 shadow-lg shadow-green-500/50' : 'bg-pink-700 hover:bg-pink-600'} transition-all`}>Bouncer</button>
              <button onClick={() => setColliderMode('magnet')} className={`btn text-sm ${colliderMode === 'magnet' ? 'bg-gradient-to-r from-green-600 to-green-500 shadow-lg shadow-green-500/50' : 'bg-blue-700 hover:bg-blue-600'} transition-all`}>Magnet</button>
              <button onClick={() => setColliderMode('destroyer')} className={`btn text-sm ${colliderMode === 'destroyer' ? 'bg-gradient-to-r from-green-600 to-green-500 shadow-lg shadow-green-500/50' : 'bg-red-700 hover:bg-red-600'} transition-all`}>Destroyer</button>
              <button onClick={() => setColliderMode('portal')} className={`btn text-sm ${colliderMode === 'portal' ? 'bg-gradient-to-r from-green-600 to-green-500 shadow-lg shadow-green-500/50' : 'bg-purple-700 hover:bg-purple-600'} transition-all`}>Portal</button>
              <button onClick={() => setColliderMode('spinner')} className={`btn text-sm ${colliderMode === 'spinner' ? 'bg-gradient-to-r from-green-600 to-green-500 shadow-lg shadow-green-500/50' : 'bg-green-700 hover:bg-green-600'} transition-all`}>Spinner</button>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        {showStats && (
          <div className="card p-4 backdrop-blur-xl bg-slate-900/60 border-2 border-pink-500/30">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="group">
                <div className="text-3xl font-extrabold bg-gradient-to-r from-red-400 to-red-600 text-transparent bg-clip-text group-hover:scale-110 transition-transform">{fps}</div>
                <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mt-1">FPS</div>
              </div>
              <div className="group">
                <div className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text group-hover:scale-110 transition-transform">{particleCount}</div>
                <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mt-1">Particles</div>
              </div>
              <div className="group">
                <div className="text-3xl font-extrabold bg-gradient-to-r from-green-400 to-green-600 text-transparent bg-clip-text group-hover:scale-110 transition-transform">{highScore.particles}</div>
                <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mt-1">High Score</div>
              </div>
              <div className="group">
                <div className="text-3xl font-extrabold bg-gradient-to-r from-purple-400 to-purple-600 text-transparent bg-clip-text group-hover:scale-110 transition-transform">{collidersRef.current.length}</div>
                <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mt-1">Colliders</div>
              </div>
            </div>
          </div>
        )}

        {/* Physics Canvas - Isolated and Elevated */}
        <div className="relative">
          <div className="card p-4 backdrop-blur-xl bg-slate-900/60 border-2 border-purple-500/50 shadow-2xl shadow-purple-500/20">
            <div
              ref={simContainerRef}
              className="relative mx-auto w-full max-w-[1200px] aspect-[10/7]"
              style={{ isolation: 'isolate' }}
            >
              <div
                ref={sceneRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="absolute inset-0 border-2 border-purple-400/40 rounded-xl cursor-crosshair bg-black/20 shadow-inner"
                style={{ isolation: 'isolate', zIndex: 1 }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

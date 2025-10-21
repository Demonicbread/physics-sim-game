import React from "react";

export default function GameHUD({
  gameMode,
  score,
  lives,
  timeRemaining,
  wave,
  combo,
  coins,
  objective,
  gameState,
  collectedParticles,
  explosionsUsed,
  maxExplosions,
  chainReactions,
  waveCountdown,
  onPause,
  onRestart,
  onQuit,
}) {
  if (gameMode === "sandbox") return null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed top-20 left-4 right-4 z-40 pointer-events-none">
      <div className="max-w-7xl mx-auto flex justify-between items-start gap-4">
        {/* Left side - Game stats */}
        <div className="card p-5 pointer-events-auto space-y-2 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-extrabold text-yellow-400">
              {score}
            </span>
            <span className="text-xs text-slate-400 uppercase">Score</span>
          </div>

          {gameMode === "survival" && (
            <>
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-red-400">
                  {"❤️".repeat(lives)}
                </span>
                <span className="text-xs text-slate-400 uppercase">Lives</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-cyan-400">
                  Wave {wave}
                </span>
                {waveCountdown > 0 && (
                  <span className="text-lg font-bold text-orange-400">
                    Next: {waveCountdown}s
                  </span>
                )}
              </div>
            </>
          )}

          {(gameMode === "collection" || gameMode === "challenge") &&
            timeRemaining !== null && (
              <div className="flex items-center gap-3">
                <span
                  className={`text-xl font-bold ${
                    timeRemaining < 10 ? "text-red-400" : "text-blue-400"
                  }`}
                >
                  {formatTime(timeRemaining)}
                </span>
                <span className="text-xs text-slate-400 uppercase">Time</span>
              </div>
            )}

          {combo > 1 && (
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-purple-400">
                x{combo}
              </span>
              <span className="text-xs text-slate-400 uppercase">Combo</span>
            </div>
          )}

          {gameMode === "reaction" && (
            <>
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-orange-400">
                  {explosionsUsed}/{maxExplosions}
                </span>
                <span className="text-xs text-slate-400 uppercase">
                  Explosions
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-pink-400">
                  {chainReactions}
                </span>
                <span className="text-xs text-slate-400 uppercase">Chains</span>
              </div>
            </>
          )}

          <div className="flex items-center gap-3 pt-2 border-t border-white/10">
            <span className="text-lg font-bold text-green-400">💰 {coins}</span>
            <span className="text-xs text-slate-400 uppercase">Coins</span>
            <button
              onClick={() => onInjectEnergy && onInjectEnergy()}
              className="ml-4 btn btn-sm btn-accent pointer-events-auto"
            >
              ⚡ Inject
            </button>
          </div>
        </div>

        {/* Right side - Objective */}
        <div className="flex items-start gap-4">
          {objective && (
            <div className="card p-5 pointer-events-auto max-w-xs backdrop-blur-xl">
              <h3 className="text-sm font-bold text-purple-300 uppercase mb-2">
                Objective
              </h3>
              <p className="text-sm text-slate-300">{objective.description}</p>
              {objective.progress !== undefined && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Progress</span>
                    <span>
                      {objective.progress}/{objective.target}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          (objective.progress / objective.target) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          <button
            onClick={onPause}
            className="btn btn-secondary p-3 pointer-events-auto text-xl"
          >
            ⏸️
          </button>
        </div>
      </div>

      {/* Collection mode color indicators */}
      {gameMode === "collection" && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
          <div className="card p-5 pointer-events-auto backdrop-blur-xl">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="w-8 h-8 rounded-full bg-red-500 mx-auto mb-1"></div>
                <span className="text-sm font-bold">
                  {collectedParticles.red}
                </span>
              </div>
              <div>
                <div className="w-8 h-8 rounded-full bg-blue-500 mx-auto mb-1"></div>
                <span className="text-sm font-bold">
                  {collectedParticles.blue}
                </span>
              </div>
              <div>
                <div className="w-8 h-8 rounded-full bg-green-500 mx-auto mb-1"></div>
                <span className="text-sm font-bold">
                  {collectedParticles.green}
                </span>
              </div>
              <div>
                <div className="w-8 h-8 rounded-full bg-yellow-500 mx-auto mb-1"></div>
                <span className="text-sm font-bold">
                  {collectedParticles.yellow}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game over / Win overlay */}
      {(gameState === "won" || gameState === "lost") && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 pointer-events-auto">
          <div className="card p-8 max-w-md text-center space-y-6 backdrop-blur-xl">
            <h2
              className={`text-5xl font-extrabold ${
                gameState === "won" ? "text-green-400" : "text-red-400"
              }`}
            >
              {gameState === "won" ? "🎉 Victory!" : "💀 Game Over"}
            </h2>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-yellow-400">
                Score: {score}
              </p>
              <p className="text-xl text-green-400">
                Coins Earned: +{gameState === "won" ? 5 : 1} 💰
              </p>
              {gameState === "lost" && (
                <p className="text-sm text-slate-400">Better luck next time!</p>
              )}
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={onRestart} className="btn btn-primary px-6 py-3">
                Play Again
              </button>
              <button onClick={onQuit} className="btn btn-ghost px-6 py-3">
                Quit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pause overlay */}
      {gameState === "paused" && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 pointer-events-auto">
          <div className="card p-8 max-w-md text-center space-y-6 backdrop-blur-xl">
            <h2 className="text-4xl font-extrabold text-cyan-400">⏸️ Paused</h2>
            <div className="flex gap-3 justify-center">
              <button onClick={onPause} className="btn btn-primary px-6 py-3">
                Resume
              </button>
              <button onClick={onRestart} className="btn btn-warning px-6 py-3">
                Restart
              </button>
              <button onClick={onQuit} className="btn btn-ghost px-6 py-3">
                Quit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

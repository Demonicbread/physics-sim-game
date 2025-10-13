import { useEffect, useRef } from 'react';
import Matter from 'matter-js';
import { SURVIVAL_WAVES } from '../utils/gameModes';

const ENEMY_COLOR = '#FF4444';

// This hook now encapsulates the logic for survival mode, but does not directly attach its own event listeners.
// It returns a collision handler to be used by the main engine effect in App.jsx.
export default function useSurvivalMode({
  gameMode,
  gameState,
  setGameState,
  currentPage,
  engineRef,
  renderRef,
  coreRef,
  createParticle,
  setScore,
  setLives,
  wave,
  setWave,
  waveCountdown,
  setWaveCountdown,
  setObjective,
}) {
  const waveTimerRef = useRef(null);
  const nextWaveTimerRef = useRef(null);

  // Wave Spawner Effect
  useEffect(() => {
    if (gameMode !== 'survival' || gameState !== 'playing' || currentPage !== 'game') {
      if (waveTimerRef.current) clearInterval(waveTimerRef.current);
      return;
    }

    const waveConfig = SURVIVAL_WAVES[Math.min(wave - 1, SURVIVAL_WAVES.length - 1)];

    waveTimerRef.current = setInterval(() => {
      if (!engineRef.current?.world) return;

      const width = renderRef.current?.options?.width;
      const height = renderRef.current?.options?.height;
      if (!width || !height) return;

      for (let i = 0; i < waveConfig.particlesPerSpawn; i++) {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        switch (side) {
          case 0: x = Math.random() * width; y = 20; break; // Top
          case 1: x = width - 20; y = Math.random() * height; break; // Right
          case 2: x = Math.random() * width; y = height - 20; break; // Bottom
          case 3: x = 20; y = Math.random() * height; break; // Left
        }

        const particle = createParticle(x, y, {
          render: { fillStyle: ENEMY_COLOR },
          isEnemy: true,
          restitution: 0.3
        });

        if (particle && coreRef.current) {
          const dx = coreRef.current.position.x - x;
          const dy = coreRef.current.position.y - y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            const force = waveConfig.particleSpeed * 0.0002;
            Matter.Body.applyForce(particle, particle.position, {
              x: (dx / dist) * force,
              y: (dy / dist) * force,
            });
          }
        }
      }
    }, waveConfig.spawnInterval);

    return () => {
      if (waveTimerRef.current) clearInterval(waveTimerRef.current);
    };
  }, [gameMode, gameState, wave, currentPage, engineRef, renderRef, coreRef, createParticle]);

  // Wave Progression Timer Effect
  useEffect(() => {
    if (gameMode !== 'survival' || gameState !== 'playing') {
      if (nextWaveTimerRef.current) clearTimeout(nextWaveTimerRef.current);
      return;
    }

    const waveConfig = SURVIVAL_WAVES[Math.min(wave - 1, SURVIVAL_WAVES.length - 1)];

    // Start countdown for next wave
    setWaveCountdown(5); // 5 second countdown

    const countdownInterval = setInterval(() => {
      setWaveCountdown((prev) => {
        if (prev <= 1) {
          // Countdown finished, start next wave
          if (wave >= SURVIVAL_WAVES.length) {
            setGameState('won');
          } else {
            setWave((w) => w + 1);
            setScore((s) => s + wave * 100); // Wave clear bonus
            setObjective((obj) => ({ ...obj, progress: wave })); // Update progress
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(countdownInterval);
      if (nextWaveTimerRef.current) clearTimeout(nextWaveTimerRef.current);
    };
  }, [gameMode, gameState, wave, setWave, setScore, setGameState, setWaveCountdown]);

  const handleSurvivalCollision = (pair) => {
    // Don't process collisions if game is already lost
    if (gameState === 'lost') return false;

    const bodyA = pair.bodyA;
    const bodyB = pair.bodyB;

    const checkCollision = (first, second) => {
      if (!second || !second.isParticle) return false;

      // Core collision
      if (first.isCore && second.isEnemy) {
        Matter.World.remove(engineRef.current.world, second);
        setLives((l) => {
          const newLives = l - 1;
          if (newLives <= 0) {
            setGameState('lost');
          }
          return newLives;
        });
        return true;
      }

      // Destroyer collision
      if (first.destroyer && second.isEnemy) {
        Matter.World.remove(engineRef.current.world, second);
        setScore((s) => s + 5);
        return true;
      }
      return false;
    };

    if (checkCollision(bodyA, bodyB)) return true;
    if (checkCollision(bodyB, bodyA)) return true;

    return false;
  };

  return { handleSurvivalCollision };
}
import { useState, useEffect } from 'react';

export function useGameLogic(particlesSpawnedRef, explosionsUsedRef, coins, setCoins) {
  const [achievements, setAchievements] = useState([]);
  const [shopOpen, setShopOpen] = useState(false);
  const [unlockedParticles, setUnlockedParticles] = useState(() => {
    try { return JSON.parse(localStorage.getItem('unlockedParticles') || '[]'); } catch(e){ return []; }
  });

  // Achievements watcher
  useEffect(() => {
    const interval = setInterval(() => {
      const unlocked = [];
      if (particlesSpawnedRef.current > 1000) unlocked.push({ id: 'spawn_1000', name: 'Spawn 1k', reward: 50 });
      if (explosionsUsedRef.current > 10) unlocked.push({ id: 'expl_10', name: 'Use 10 explosions', reward: 25 });
      // Grant any new achievements
      unlocked.forEach((a) => {
        if (!achievements.find(x => x.id === a.id)) {
          setAchievements(prev => [...prev, a]);
          setCoins(c => { const n = c + a.reward; localStorage.setItem('totalCoins', n.toString()); return n; });
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [particlesSpawnedRef, explosionsUsedRef, achievements, setCoins]);

  const shopItems = [
    { id: 'plasma', name: 'Plasma', cost: 100 },
    { id: 'metal', name: 'Metal', cost: 150 },
  ];

  const buyItem = (item) => {
    if (coins >= item.cost && !unlockedParticles.includes(item.id)) {
      setCoins(c => { const n = c - item.cost; localStorage.setItem('totalCoins', n.toString()); return n; });
      const next = [...unlockedParticles, item.id];
      setUnlockedParticles(next);
      localStorage.setItem('unlockedParticles', JSON.stringify(next));
    }
  };

  return {
    achievements,
    shopOpen,
    setShopOpen,
    unlockedParticles,
    shopItems,
    buyItem,
  };
}

// Game mode configurations and level definitions

export const CHALLENGE_LEVELS = [
  {
    level: 1,
    name: "First Steps",
    objective: "Collect 20 particles in the goal zone",
    target: 20,
    timeLimit: 60,
    particleBudget: 50,
    difficulty: 1
  },
  {
    level: 2,
    name: "Gravity Master",
    objective: "Keep 30 particles alive for 45 seconds",
    target: 30,
    timeLimit: 45,
    particleBudget: 40,
    difficulty: 1
  },
  {
    level: 3,
    name: "Destroyer",
    objective: "Destroy 50 particles using destroyers",
    target: 50,
    timeLimit: 60,
    particleBudget: 100,
    difficulty: 2
  },
  {
    level: 4,
    name: "Portal Puzzle",
    objective: "Send 25 particles through portals",
    target: 25,
    timeLimit: 90,
    particleBudget: 50,
    difficulty: 2
  },
  {
    level: 5,
    name: "Bouncer Challenge",
    objective: "Score 100 points using bouncers",
    target: 100,
    timeLimit: 120,
    particleBudget: 80,
    difficulty: 2
  },
  {
    level: 6,
    name: "Speed Run",
    objective: "Collect 40 particles in 30 seconds",
    target: 40,
    timeLimit: 30,
    particleBudget: 60,
    difficulty: 3
  },
  {
    level: 7,
    name: "Magnetic Mastery",
    objective: "Guide 35 particles using only magnets",
    target: 35,
    timeLimit: 90,
    particleBudget: 50,
    difficulty: 3
  },
  {
    level: 8,
    name: "Precision",
    objective: "Collect 50 particles without losing any",
    target: 50,
    timeLimit: 120,
    particleBudget: 50,
    difficulty: 3
  },
  {
    level: 9,
    name: "Chaos Control",
    objective: "Manage 100 particles and collect 60",
    target: 60,
    timeLimit: 150,
    particleBudget: 100,
    difficulty: 4
  },
  {
    level: 10,
    name: "The Gauntlet",
    objective: "Complete all objectives: 80 collected, 20 destroyed",
    target: 100,
    timeLimit: 180,
    particleBudget: 150,
    difficulty: 4
  },
  {
    level: 11,
    name: "Reverse Gravity",
    objective: "Collect 45 particles with negative gravity",
    target: 45,
    timeLimit: 90,
    particleBudget: 70,
    difficulty: 4
  },
  {
    level: 12,
    name: "Time Trial",
    objective: "Collect 60 particles in 45 seconds",
    target: 60,
    timeLimit: 45,
    particleBudget: 80,
    difficulty: 5
  },
  {
    level: 13,
    name: "Spinner Madness",
    objective: "Use spinners to collect 50 particles",
    target: 50,
    timeLimit: 120,
    particleBudget: 80,
    difficulty: 5
  },
  {
    level: 14,
    name: "Multi-Portal",
    objective: "Create 4 portals and send 40 particles through",
    target: 40,
    timeLimit: 100,
    particleBudget: 60,
    difficulty: 5
  },
  {
    level: 15,
    name: "Endurance",
    objective: "Keep 50 particles alive for 2 minutes",
    target: 50,
    timeLimit: 120,
    particleBudget: 60,
    difficulty: 5
  },
  {
    level: 16,
    name: "Expert Precision",
    objective: "Collect 70 particles with only 70 spawns",
    target: 70,
    timeLimit: 150,
    particleBudget: 70,
    difficulty: 6
  },
  {
    level: 17,
    name: "Destruction Derby",
    objective: "Destroy 100 particles efficiently",
    target: 100,
    timeLimit: 120,
    particleBudget: 150,
    difficulty: 6
  },
  {
    level: 18,
    name: "Ultimate Speed",
    objective: "Collect 80 particles in 40 seconds",
    target: 80,
    timeLimit: 40,
    particleBudget: 100,
    difficulty: 6
  },
  {
    level: 19,
    name: "Master Challenge",
    objective: "Collect 100 particles with complex obstacles",
    target: 100,
    timeLimit: 180,
    particleBudget: 120,
    difficulty: 7
  },
  {
    level: 20,
    name: "FINAL BOSS",
    objective: "Complete the ultimate physics challenge",
    target: 150,
    timeLimit: 240,
    particleBudget: 200,
    difficulty: 10
  }
];

export const SURVIVAL_WAVES = [
  { wave: 1, particlesPerSpawn: 5, spawnInterval: 3000, particleSpeed: 0.5 },
  { wave: 2, particlesPerSpawn: 7, spawnInterval: 2800, particleSpeed: 0.6 },
  { wave: 3, particlesPerSpawn: 10, spawnInterval: 2500, particleSpeed: 0.7 },
  { wave: 4, particlesPerSpawn: 12, spawnInterval: 2200, particleSpeed: 0.8 },
  { wave: 5, particlesPerSpawn: 15, spawnInterval: 2000, particleSpeed: 0.9 },
  { wave: 6, particlesPerSpawn: 18, spawnInterval: 1800, particleSpeed: 1.0 },
  { wave: 7, particlesPerSpawn: 20, spawnInterval: 1600, particleSpeed: 1.1 },
  { wave: 8, particlesPerSpawn: 25, spawnInterval: 1400, particleSpeed: 1.2 },
  { wave: 9, particlesPerSpawn: 30, spawnInterval: 1200, particleSpeed: 1.3 },
  { wave: 10, particlesPerSpawn: 40, spawnInterval: 1000, particleSpeed: 1.5 }
];

export const COLLECTION_COLORS = ['red', 'blue', 'green', 'yellow'];

export const REACTION_LEVELS = [
  { level: 1, target: 10, maxExplosions: 3, particleCount: 30 },
  { level: 2, target: 20, maxExplosions: 4, particleCount: 50 },
  { level: 3, target: 30, maxExplosions: 5, particleCount: 70 },
  { level: 4, target: 50, maxExplosions: 6, particleCount: 100 },
  { level: 5, target: 75, maxExplosions: 7, particleCount: 150 }
];

export function calculateScore(gameMode, params) {
  switch (gameMode) {
    case 'challenge':
      return params.collected * 10 + params.timeBonus * 5;
    case 'survival':
      return params.wave * 100 + params.particlesDestroyed * 5;
    case 'collection':
      return params.correctSorts * 20 - params.wrongSorts * 10 + params.comboBonus;
    case 'reaction':
      return params.chainLength * 50 + params.efficiency * 100;
    default:
      return 0;
  }
}

export function calculateCoins(score, stars = 1) {
  return Math.floor(score / 10) * stars;
}

export function getStarRating(score, level) {
  const thresholds = {
    1: [100, 200, 300],
    2: [150, 300, 500],
    3: [200, 400, 700]
  };
  
  const difficulty = Math.min(3, Math.ceil(level / 7));
  const [bronze, silver, gold] = thresholds[difficulty];
  
  if (score >= gold) return 3;
  if (score >= silver) return 2;
  if (score >= bronze) return 1;
  return 0;
}

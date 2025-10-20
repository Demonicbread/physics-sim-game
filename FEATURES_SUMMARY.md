# PhysicsBox - Physics Simulation Game Features Overview

## Table of Contents
1. [Introduction](#introduction)
2. [Game Modes](#game-modes)
3. [Particle System](#particle-system)
4. [Tools and Controls](#tools-and-controls)
5. [Colliders](#colliders)
6. [Physics Engine](#physics-engine)
7. [User Interface](#user-interface)
8. [Multi-language Support](#multi-language-support)
9. [Game Progression](#game-progression)
10. [Technical Implementation](#technical-implementation)

## Introduction

PhysicsBox is a relaxing physics sandbox game built with React and Matter.js. It features multiple game modes, various particle types, interactive tools, and advanced physics controls. The game supports multiple languages and includes a coin-based progression system.

## Game Modes

### 1. Sandbox Mode
Free-play mode for creative physics experimentation.

```javascript
// Particle creation in sandbox mode
const createParticle = useCallback(
  (x, y, customProps = {}) => {
    if (!engineRef.current || particleCount >= 50000) return null;

    const world = engineRef.current.world;
    let body;

    switch (mode) {
      case "balls":
        body = Matter.Bodies.circle(x, y, particleSize, {
          ...baseProps,
          restitution: 0.8,
          density: 0.001,
        });
        break;
      case "sand":
        body = Matter.Bodies.rectangle(
          x,
          y,
          particleSize * 1.5,
          particleSize * 1.5,
          {
            ...baseProps,
            friction: 0.9,
            frictionStatic: 1,
            density: 0.002,
            restitution: 0.0,
          }
        );
        break;
      // ... more particle types
    }
  },
  [mode, particleSize, color, particleCount, particleTrails, particlesSpawned, particleBudget, gameMode]
);
```

### 2. Challenge Mode
20 progressive levels with specific objectives.

```javascript
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
  // ... 18 more levels
];
```

### 3. Survival Mode
Defend a core from endless waves of enemy particles.

```javascript
const handleSurvivalCollision = (pair) => {
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
          setGameState("lost");
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
```

### 4. Collection Mode
Sort particles into matching colored zones by dragging.

```javascript
// Pointer events for improved dragging in collection mode
const onPointerDown = (e) => {
  if (gameMode !== "collection") return;
  e.preventDefault();

  const rect = render.canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Find particle under pointer
  const particle = particlesRef.current.find((p) => {
    const dx = p.position.x - x;
    const dy = p.position.y - y;
    const distSq = dx * dx + dy * dy;
    return distSq <= 900; // 30px radius
  });

  if (particle) {
    draggedRef.current = particle;
    dragOffsetRef.current = { x: x - particle.position.x, y: y - particle.position.y };
    e.target.setPointerCapture(e.pointerId);
  }
};
```

### 5. Reaction Mode
Create explosive chain reactions.

```javascript
// Chain reaction handling
particlesToExplode.forEach((p, index) => {
  setTimeout(() => {
    if (particlesRef.current.includes(p)) {
      const pos = p.position;
      // Create secondary explosion
      explosionsRef.current.push({
        x: pos.x,
        y: pos.y,
        power: explosionPower * 0.7,
        radius: explosionPower * 1.4,
        life: 1.0,
      });

      // Remove the exploded particle
      Matter.World.remove(engineRef.current.world, p);
      const idx = particlesRef.current.indexOf(p);
      if (idx > -1) {
        particlesRef.current.splice(idx, 1);
        setParticleCount((c) => Math.max(0, c - 1));
      }

      // Update reaction mode progress
      if (gameMode === "reaction") {
        setObjective((obj) => {
          if (!obj) return null;
          const newProgress = obj.progress + 1;
          if (newProgress >= obj.target) {
            setGameState("won");
          }
          return { ...obj, progress: newProgress };
        });
      }
    }
  }, index * 50); // Stagger explosions
});
```

## Particle System

### Particle Types
- **Bouncing Balls**: High restitution, low density
- **Falling Sand**: High friction, rectangular shape
- **Water Drops**: Low friction, fluid-like behavior
- **Plasma Energy**: High restitution, colorful particles
- **Metal Chunks**: High density, low restitution
- **Explosives**: Trigger chain reactions

### Particle Properties
```javascript
const baseProps = {
  render: { fillStyle: color },
  frictionAir: 0.01,
  ...customProps,
};
```

## Tools and Controls

### Interaction Tools
- **Normal**: Standard particle spawning
- **Spray**: Continuous particle spawning while moving
- **Particle Gun**: Fire particles with velocity
- **Explosion**: Create explosion at cursor
- **Drag**: Move colliders around
- **Patrol**: Set colliders to move in patterns

### Physics Controls
```javascript
// Gravity control
world.gravity.y = gravity;

// Time scaling
engine.timing.timeScale = timeScale;

// Wind force application
if (wf !== 0) {
  particlesRef.current.forEach((p) => {
    Matter.Body.applyForce(p, p.position, { x: wf * 0.000002, y: 0 });
  });
}
```

## Colliders

### Types of Colliders
- **Platform**: Static surface for particles to interact with
- **Super Bouncer**: High restitution for bouncing effects
- **Magnet**: Attracts particles within range
- **Destroyer**: Removes particles on contact
- **Portal**: Teleports particles between linked portals
- **Spinner**: Rotating platform with angular velocity

### Collider Creation
```javascript
switch (type) {
  case "platform":
    collider = Matter.Bodies.rectangle(x, y, 120, 20, {
      isStatic: true,
      render: { fillStyle: "#8B4513" },
      friction: 0.8,
      restitution: 0.3,
    });
    break;
  case "portal":
    collider = Matter.Bodies.circle(x, y, 40, {
      isStatic: true,
      render: { fillStyle: "#9400D3" },
      isSensor: true,
      portal: true,
    });
    portalsRef.current.push(collider);
    break;
  // ... more collider types
}
```

## Physics Engine

### Matter.js Integration
```javascript
// Engine initialization
const engine = Matter.Engine.create();
engineRef.current = engine;
const world = engine.world;

// World bounds
const ground = Matter.Bodies.rectangle(
  width / 2,
  height + thickness / 2 - 1,
  width,
  thickness,
  { isStatic: true, render: { fillStyle: "#2a2a2a" } }
);

// Collision detection
Matter.Events.on(engine, "collisionStart", onCollisionStart);

// Rendering
const render = Matter.Render.create({
  element: sceneRef.current,
  engine,
  options: {
    width,
    height,
    wireframes: false,
    background: "transparent",
    pixelRatio: window.devicePixelRatio || 1,
  },
});
```

### Advanced Physics Features
- **Particle Trails**: Visual trails behind moving particles
- **Screen Shake**: Camera shake effects on explosions
- **Magnetism**: Real-time attractive forces
- **Wind Forces**: Continuous force application
- **Time Scaling**: Slow-motion and fast-forward effects

## User Interface

### Game HUD
```javascript
// GameHUD component displays real-time stats
<GameHUD
  gameMode={gameMode}
  score={score}
  lives={lives}
  timeRemaining={timeRemaining}
  wave={wave}
  combo={combo}
  coins={coins}
  objective={objective}
  gameState={gameState}
  collectedParticles={collectedParticles}
  explosionsUsed={explosionsUsed}
  maxExplosions={maxExplosions}
  chainReactions={chainReactions}
  waveCountdown={waveCountdown}
  onPause={handlePause}
  onRestart={handleRestart}
  onQuit={handleQuit}
/>
```

### Responsive Design
Built with Tailwind CSS for mobile and desktop compatibility.

### Navigation
```javascript
// Navbar with language selector
<Navbar
  setCurrentPage={setCurrentPage}
  currentLanguage={currentLanguage}
  onLanguageChange={handleLanguageChange}
/>
```

## Multi-language Support

### Translation System
```javascript
const translations = {
  en: {
    title: "PhysicsBox",
    subtitle: "Relaxing Physics Sandbox",
    // ... English translations
  },
  ar: {
    title: "فيزيكس بوكس",
    subtitle: "صندوق فيزياء مريح",
    // ... Arabic translations
  },
  es: {
    title: "PhysicsBox",
    subtitle: "Caja de Física Relajante",
    // ... Spanish translations
  },
};
```

### Language Switching
```javascript
const handleLanguageChange = (language) => {
  setCurrentLanguage(language);
  localStorage.setItem("language", language);
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = language;
};
```

## Game Progression

### Coin System
```javascript
// Coin rewards for game completion
const earnedCoins = gameState === "won" ? 5 : 1;
setCoins((prev) => {
  const total = prev + earnedCoins;
  localStorage.setItem("totalCoins", total.toString());
  return total;
});
```

### High Score Tracking
```javascript
// High score calculation
if (currentParticleCount > highScore.particles ||
    (currentParticleCount === highScore.particles && currentFps > highScore.fps)) {
  const newHigh = { particles: currentParticleCount, fps: currentFps };
  setHighScore(newHigh);
  localStorage.setItem("highScore", JSON.stringify(newHigh));
}
```

### Scoring Functions
```javascript
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
```

## Technical Implementation

### State Management
```javascript
// Complex state management with multiple game modes
const [gameMode, setGameMode] = useState("sandbox");
const [currentLevel, setCurrentLevel] = useState(1);
const [score, setScore] = useState(0);
const [coins, setCoins] = useState(0);
const [lives, setLives] = useState(3);
const [timeRemaining, setTimeRemaining] = useState(60);
// ... many more state variables
```

### Performance Optimizations
- **Particle Limit**: 50,000 particles maximum
- **Efficient Rendering**: Matter.js optimized rendering
- **Ref-based State**: Using refs for performance-critical updates
- **Event Delegation**: Optimized event handling

### Browser Compatibility
- Works in all modern browsers
- No installation required
- Responsive design for mobile and desktop

### Development Stack
- **Frontend**: React 18 with hooks
- **Physics Engine**: Matter.js
- **Styling**: Tailwind CSS
- **Icons**: FontAwesome
- **Build Tool**: Vite
- **Deployment**: Static hosting

This comprehensive physics simulation game offers both relaxation and challenge, with extensive customization options and multiple gameplay modes to suit different player preferences.

import { useState, useEffect, useRef, useCallback } from 'react';
import Matter from 'matter-js';
import Navbar from './components/Navbar';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [fps, setFps] = useState(0);
  const [particleCount, setParticleCount] = useState(0);
  const [mode, setMode] = useState('balls');
  const [gravity, setGravity] = useState(1);
  const [particleSize, setParticleSize] = useState(5);
  const [color, setColor] = useState('#ff0000');
  const [highScore, setHighScore] = useState({ particles: 0, fps: 0 });
  
  // Advanced physics states
  const [colliderMode, setColliderMode] = useState('none');
  const [toolMode, setToolMode] = useState('none');
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [windForce, setWindForce] = useState(0);
  const [magnetStrength, setMagnetStrength] = useState(0);
  const [explosionPower, setExplosionPower] = useState(50);
  const [particleTrails, setParticleTrails] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [timeScale, setTimeScale] = useState(1);
  const [showStats, setShowStats] = useState(true);
  
  // Refs
  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const particlesRef = useRef([]);
  const collidersRef = useRef([]);
  const runnerRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const explosionsRef = useRef([]);
  const magnetsRef = useRef([]);
  const windRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('highScore');
    if (saved) {
      setHighScore(JSON.parse(saved));
    }
  }, []);

  // Initialize physics engine
  useEffect(() => {
    if (currentPage !== 'game' || !sceneRef.current) return;

    // Cleanup existing
    if (engineRef.current) {
      if (renderRef.current) {
        Matter.Render.stop(renderRef.current);
        if (renderRef.current.canvas) {
          renderRef.current.canvas.remove();
        }
      }
      if (runnerRef.current) {
        Matter.Runner.stop(runnerRef.current);
      }
      Matter.Engine.clear(engineRef.current);
    }

    // Create engine with advanced settings
    const engine = Matter.Engine.create();
    engineRef.current = engine;
    const world = engine.world;

    // Enhanced physics settings
    world.gravity.y = gravity;
    engine.timing.timeScale = timeScale;
    engine.constraintIterations = 2;
    engine.positionIterations = 6;
    engine.velocityIterations = 4;

    // Create renderer with effects
    const render = Matter.Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: 1000,
        height: 700,
        wireframes: false,
        background: 'transparent',
        showAngleIndicator: false,
        showVelocity: false,
        showDebug: false,
        pixelRatio: window.devicePixelRatio || 1
      }
    });
    renderRef.current = render;

    // Enhanced boundaries
    const thickness = 30;
    const ground = Matter.Bodies.rectangle(500, 715, 1000, thickness, { 
      isStatic: true, 
      render: { fillStyle: '#2a2a2a' },
      friction: 0.8,
      restitution: 0.3
    });
    const leftWall = Matter.Bodies.rectangle(-15, 350, thickness, 700, { 
      isStatic: true, 
      render: { fillStyle: '#2a2a2a' },
      friction: 0.8,
      restitution: 0.3
    });
    const rightWall = Matter.Bodies.rectangle(1015, 350, thickness, 700, { 
      isStatic: true, 
      render: { fillStyle: '#2a2a2a' },
      friction: 0.8,
      restitution: 0.3
    });
    const ceiling = Matter.Bodies.rectangle(500, -15, 1000, thickness, { 
      isStatic: true, 
      render: { fillStyle: '#2a2a2a' },
      friction: 0.8,
      restitution: 0.3
    });
    
    Matter.World.add(world, [ground, leftWall, rightWall, ceiling]);

    // Enhanced mouse control
    const mouse = Matter.Mouse.create(render.canvas);
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false }
      }
    });
    Matter.World.add(world, mouseConstraint);

    // Mouse tracking
    render.canvas.addEventListener('mousemove', (e) => {
      const rect = render.canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    });

    // Create runner
    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    
    // Start physics
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);

    // Reset
    particlesRef.current = [];
    collidersRef.current = [];
    explosionsRef.current = [];
    magnetsRef.current = [];
    setParticleCount(0);

    // Advanced physics loop
    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId;

    const physicsLoop = () => {
      const now = performance.now();
      frameCount++;
      
      // Apply wind force
      if (windForce !== 0) {
        particlesRef.current.forEach(particle => {
          Matter.Body.applyForce(particle, particle.position, { 
            x: windForce * 0.001, 
            y: 0 
          });
        });
      }

      // Apply magnetic forces
      magnetsRef.current.forEach(magnet => {
        particlesRef.current.forEach(particle => {
          const dx = magnet.position.x - particle.position.x;
          const dy = magnet.position.y - particle.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 200 && distance > 0) {
            const force = (magnetStrength * 0.0001) / (distance * distance);
            Matter.Body.applyForce(particle, particle.position, {
              x: dx * force,
              y: dy * force
            });
          }
        });
      });

      // Update explosions
      explosionsRef.current = explosionsRef.current.filter(explosion => {
        explosion.life -= 0.02;
        if (explosion.life <= 0) return false;
        
        // Apply explosion force
        particlesRef.current.forEach(particle => {
          const dx = particle.position.x - explosion.x;
          const dy = particle.position.y - explosion.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < explosion.radius && distance > 0) {
            const force = (explosion.power * 0.001) / (distance + 1);
            Matter.Body.applyForce(particle, particle.position, {
              x: (dx / distance) * force,
              y: (dy / distance) * force
            });
          }
        });
        
        return true;
      });

      // FPS calculation
      if (now - lastTime >= 1000) {
        const currentFps = Math.round((frameCount * 1000) / (now - lastTime));
        setFps(currentFps);

        const currentParticleCount = particlesRef.current.length;
        if (currentParticleCount > highScore.particles || 
           (currentParticleCount === highScore.particles && currentFps > highScore.fps)) {
          const newHigh = { particles: currentParticleCount, fps: currentFps };
          setHighScore(newHigh);
          localStorage.setItem('highScore', JSON.stringify(newHigh));
        }

        frameCount = 0;
        lastTime = now;
      }
      
      animationFrameId = requestAnimationFrame(physicsLoop);
    };
    physicsLoop();

    // Cleanup
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (renderRef.current) {
        Matter.Render.stop(renderRef.current);
        if (renderRef.current.canvas) {
          renderRef.current.canvas.remove();
        }
      }
      if (runnerRef.current) {
        Matter.Runner.stop(runnerRef.current);
      }
      if (engineRef.current) {
        Matter.World.clear(engineRef.current.world);
        Matter.Engine.clear(engineRef.current);
      }
      particlesRef.current = [];
      collidersRef.current = [];
      explosionsRef.current = [];
      magnetsRef.current = [];
      setParticleCount(0);
      setFps(0);
    };
  }, [currentPage, gravity, timeScale, windForce, magnetStrength]);

  // Particle creation with advanced properties
  const createParticle = useCallback((x, y, customProps = {}) => {
    if (!engineRef.current || particleCount >= 50000) return null;
    
    const world = engineRef.current.world;
    let body;
    
    const baseProps = {
      render: { fillStyle: color },
      frictionAir: 0.01,
      ...customProps
    };

    switch (mode) {
      case 'balls':
        body = Matter.Bodies.circle(x, y, particleSize, {
          ...baseProps,
          restitution: 0.8,
          density: 0.001
        });
        break;
      case 'sand':
        body = Matter.Bodies.rectangle(x, y, particleSize * 1.5, particleSize * 1.5, {
          ...baseProps,
          friction: 0.9,
          frictionStatic: 1,
          density: 0.002,
          restitution: 0.1
        });
        break;
      case 'water':
        body = Matter.Bodies.circle(x, y, particleSize * 0.8, {
          ...baseProps,
          friction: 0.1,
          restitution: 0.1,
          density: 0.0008,
          frictionAir: 0.02
        });
        break;
      case 'plasma':
        body = Matter.Bodies.circle(x, y, particleSize, {
          ...baseProps,
          restitution: 1.2,
          density: 0.0005,
          frictionAir: 0.005,
          render: { 
            fillStyle: `hsl(${Math.random() * 60 + 300}, 100%, 70%)`,
          }
        });
        break;
      case 'metal':
        body = Matter.Bodies.rectangle(x, y, particleSize * 2, particleSize * 2, {
          ...baseProps,
          density: 0.005,
          friction: 0.8,
          restitution: 0.3,
          render: { fillStyle: '#C0C0C0' }
        });
        break;
      case 'explosive':
        body = Matter.Bodies.circle(x, y, particleSize, {
          ...baseProps,
          restitution: 0.6,
          density: 0.001,
          render: { fillStyle: '#FF4500' },
          explosive: true
        });
        break;
      default:
        body = Matter.Bodies.circle(x, y, particleSize, baseProps);
    }

    if (body) {
      // Add particle trail effect
      if (particleTrails) {
        body.trail = [];
      }
      
      Matter.World.add(world, body);
      particlesRef.current.push(body);
      setParticleCount(prev => prev + 1);
      return body;
    }
    return null;
  }, [mode, particleSize, color, particleCount, particleTrails]);

  // Advanced particle spawning
  const spawnParticles = useCallback((x, y, count = 1, spread = 0) => {
    for (let i = 0; i < count; i++) {
      const offsetX = (Math.random() - 0.5) * spread;
      const offsetY = (Math.random() - 0.5) * spread;
      createParticle(x + offsetX, y + offsetY);
    }
  }, [createParticle]);

  // Particle gun
  const fireParticleGun = useCallback((x, y) => {
    const particle = createParticle(x, y);
    if (particle) {
      const angle = Math.random() * Math.PI * 2;
      const force = 0.02;
      Matter.Body.applyForce(particle, particle.position, {
        x: Math.cos(angle) * force,
        y: Math.sin(angle) * force
      });
    }
  }, [createParticle]);

  // Explosion system
  const createExplosion = useCallback((x, y, power = explosionPower) => {
    explosionsRef.current.push({
      x, y, power, radius: power * 2, life: 1.0
    });
    
    // Screen shake
    if (screenShake && sceneRef.current) {
      const intensity = Math.min(power / 50, 10);
      sceneRef.current.style.transform = `translate(${(Math.random() - 0.5) * intensity}px, ${(Math.random() - 0.5) * intensity}px)`;
      setTimeout(() => {
        if (sceneRef.current) {
          sceneRef.current.style.transform = 'translate(0, 0)';
        }
      }, 100);
    }

    // Remove particles in explosion radius
    const particlesToRemove = particlesRef.current.filter(particle => {
      const dx = particle.position.x - x;
      const dy = particle.position.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < power;
    });

    particlesToRemove.forEach(particle => {
      Matter.World.remove(engineRef.current.world, particle);
      const index = particlesRef.current.indexOf(particle);
      if (index > -1) {
        particlesRef.current.splice(index, 1);
        setParticleCount(prev => prev - 1);
      }
    });
  }, [explosionPower, screenShake]);

  // Advanced colliders
  const createCollider = useCallback((x, y, type) => {
    if (!engineRef.current) return;
    const world = engineRef.current.world;
    let collider;

    switch (type) {
      case 'platform':
        collider = Matter.Bodies.rectangle(x, y, 120, 20, {
          isStatic: true,
          render: { fillStyle: '#8B4513' },
          friction: 0.8,
          restitution: 0.3
        });
        break;
      case 'bouncer':
        collider = Matter.Bodies.circle(x, y, 30, {
          isStatic: true,
          restitution: 1.8,
          render: { fillStyle: '#FF1493' }
        });
        break;
      case 'magnet':
        collider = Matter.Bodies.circle(x, y, 25, {
          isStatic: true,
          render: { fillStyle: '#4169E1' },
          isSensor: true
        });
        magnetsRef.current.push({ position: { x, y }, strength: magnetStrength });
        break;
      case 'destroyer':
        collider = Matter.Bodies.rectangle(x, y, 60, 60, {
          isStatic: true,
          render: { fillStyle: '#FF0000' },
          isSensor: true,
          destroyer: true
        });
        break;
      case 'portal':
        collider = Matter.Bodies.circle(x, y, 40, {
          isStatic: true,
          render: { fillStyle: '#9400D3' },
          isSensor: true,
          portal: true
        });
        break;
      case 'spinner':
        collider = Matter.Bodies.rectangle(x, y, 100, 20, {
          render: { fillStyle: '#32CD32' },
          frictionAir: 0.01
        });
        // Add rotation
        Matter.Body.setAngularVelocity(collider, 0.1);
        break;
      default:
        return;
    }

    if (collider) {
      Matter.World.add(world, collider);
      collidersRef.current.push(collider);
    }
  }, [magnetStrength]);

  // Mouse interaction handlers
  const handleMouseDown = useCallback((e) => {
    setIsMouseDown(true);
    const rect = sceneRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    switch (toolMode) {
      case 'explosion':
        createExplosion(x, y);
        break;
      case 'gun':
        fireParticleGun(x, y);
        break;
      default:
        if (colliderMode !== 'none') {
          createCollider(x, y, colliderMode);
        } else {
          spawnParticles(x, y, 1);
        }
    }
  }, [toolMode, colliderMode, createExplosion, fireParticleGun, createCollider, spawnParticles]);

  const handleMouseMove = useCallback((e) => {
    if (!isMouseDown) return;
    
    const rect = sceneRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (toolMode === 'gun') {
      fireParticleGun(x, y);
    } else if (toolMode === 'spray' || (toolMode === 'none' && colliderMode === 'none')) {
      spawnParticles(x, y, 1);
    }
  }, [isMouseDown, toolMode, colliderMode, fireParticleGun, spawnParticles]);

  const handleMouseUp = useCallback(() => {
    setIsMouseDown(false);
  }, []);

  // Utility functions
  const clearWorld = useCallback(() => {
    if (!engineRef.current) return;
    const world = engineRef.current.world;
    
    [...particlesRef.current, ...collidersRef.current].forEach(body => {
      Matter.World.remove(world, body);
    });
    
    particlesRef.current = [];
    collidersRef.current = [];
    explosionsRef.current = [];
    magnetsRef.current = [];
    setParticleCount(0);
  }, []);

  const stressTest = useCallback(() => {
    const centerX = 500;
    const centerY = 100;
    spawnParticles(centerX, centerY, 500, 200);
  }, [spawnParticles]);

  const megaStressTest = useCallback(() => {
    const centerX = 500;
    const centerY = 100;
    spawnParticles(centerX, centerY, 2000, 300);
  }, [spawnParticles]);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <div className="text-center py-32 bg-gradient-to-b from-black via-purple-900 to-black min-h-screen text-white">
            <div className="relative">
              <h1 className="text-8xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-transparent bg-clip-text mb-4 animate-pulse">
                PHYSICS SIM
              </h1>
              <h2 className="text-6xl font-bold bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 text-transparent bg-clip-text mb-8">
                EXTREME
              </h2>
              <div className="text-2xl mb-8 text-gray-300">
                <p>🔥 50,000 PARTICLE LIMIT</p>
                <p>💥 EXPLOSIVE PHYSICS</p>
                <p>🧲 MAGNETIC FORCES</p>
                <p>⚡ INSANE PERFORMANCE</p>
              </div>
              <button
                onClick={() => setCurrentPage('game')}
                className="bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 text-white px-12 py-4 rounded-xl font-bold text-xl cursor-pointer hover:scale-110 transform transition-all duration-300 shadow-2xl animate-bounce"
              >
                🚀 UNLEASH CHAOS 🚀
              </button>
            </div>
          </div>
        );
      case 'game':
        return (
          <div className="py-8 bg-gradient-to-b from-black via-gray-900 to-black min-h-screen text-white">
            <h2 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text">
              EXTREME PHYSICS SIMULATOR
            </h2>
            
            <div className="max-w-7xl mx-auto bg-gray-900/50 p-6 rounded-xl border border-purple-500/30">
              {/* Main Controls */}
              <div className="mb-4 flex flex-wrap gap-3 items-center justify-center">
                <select value={mode} onChange={(e) => setMode(e.target.value)} className="p-2 bg-gray-800 text-white rounded border border-purple-500">
                  <option value="balls">🏀 Bouncing Balls</option>
                  <option value="sand">🏖️ Falling Sand</option>
                  <option value="water">💧 Water Drops</option>
                  <option value="plasma">⚡ Plasma Energy</option>
                  <option value="metal">🔩 Metal Chunks</option>
                  <option value="explosive">💥 Explosives</option>
                </select>
                
                <button onClick={() => spawnParticles(500, 100, 1)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-bold">
                  ➕ Add Particle
                </button>
                <button onClick={stressTest} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded font-bold">
                  🔥 Stress Test (500)
                </button>
                <button onClick={megaStressTest} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-bold">
                  💀 MEGA TEST (2000)
                </button>
                <button onClick={clearWorld} className="px-4 py-2 bg-red-800 hover:bg-red-900 rounded font-bold">
                  🗑️ Clear All
                </button>
              </div>

              {/* Physics Controls */}
              <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800/50 p-3 rounded">
                  <label className="block text-sm font-bold mb-1">🌍 Gravity: {gravity}</label>
                  <input type="range" min="-2" max="3" step="0.1" value={gravity} 
                         onChange={(e) => setGravity(parseFloat(e.target.value))} 
                         className="w-full" />
                </div>
                <div className="bg-gray-800/50 p-3 rounded">
                  <label className="block text-sm font-bold mb-1">📏 Size: {particleSize}</label>
                  <input type="range" min="1" max="30" value={particleSize} 
                         onChange={(e) => setParticleSize(parseInt(e.target.value))} 
                         className="w-full" />
                </div>
                <div className="bg-gray-800/50 p-3 rounded">
                  <label className="block text-sm font-bold mb-1">💨 Wind: {windForce}</label>
                  <input type="range" min="-50" max="50" value={windForce} 
                         onChange={(e) => setWindForce(parseInt(e.target.value))} 
                         className="w-full" />
                </div>
                <div className="bg-gray-800/50 p-3 rounded">
                  <label className="block text-sm font-bold mb-1">🧲 Magnet: {magnetStrength}</label>
                  <input type="range" min="-100" max="100" value={magnetStrength} 
                         onChange={(e) => setMagnetStrength(parseInt(e.target.value))} 
                         className="w-full" />
                </div>
              </div>

              {/* Advanced Controls */}
              <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800/50 p-3 rounded">
                  <label className="block text-sm font-bold mb-1">⏰ Time: {timeScale}</label>
                  <input type="range" min="0.1" max="3" step="0.1" value={timeScale} 
                         onChange={(e) => setTimeScale(parseFloat(e.target.value))} 
                         className="w-full" />
                </div>
                <div className="bg-gray-800/50 p-3 rounded">
                  <label className="block text-sm font-bold mb-1">💥 Explosion: {explosionPower}</label>
                  <input type="range" min="10" max="200" value={explosionPower} 
                         onChange={(e) => setExplosionPower(parseInt(e.target.value))} 
                         className="w-full" />
                </div>
                <div className="bg-gray-800/50 p-3 rounded">
                  <label className="block text-sm font-bold mb-1">🎨 Color</label>
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)} 
                         className="w-full h-8 rounded" />
                </div>
                <div className="bg-gray-800/50 p-3 rounded flex items-center justify-center">
                  <button onClick={() => setScreenShake(!screenShake)} 
                          className={`px-3 py-1 rounded text-sm ${screenShake ? 'bg-green-600' : 'bg-gray-600'}`}>
                    📳 Screen Shake
                  </button>
                </div>
              </div>

              {/* Tools */}
              <div className="mb-4 bg-gray-800/30 p-4 rounded-lg">
                <h3 className="text-lg font-bold mb-2 text-purple-400">🛠️ TOOLS</h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setToolMode('none')} 
                          className={`px-3 py-2 rounded text-sm ${toolMode === 'none' ? 'bg-green-600' : 'bg-gray-600'}`}>
                    🖱️ Normal
                  </button>
                  <button onClick={() => setToolMode('spray')} 
                          className={`px-3 py-2 rounded text-sm ${toolMode === 'spray' ? 'bg-green-600' : 'bg-blue-600'}`}>
                    🎨 Spray
                  </button>
                  <button onClick={() => setToolMode('gun')} 
                          className={`px-3 py-2 rounded text-sm ${toolMode === 'gun' ? 'bg-green-600' : 'bg-yellow-600'}`}>
                    🔫 Particle Gun
                  </button>
                  <button onClick={() => setToolMode('explosion')} 
                          className={`px-3 py-2 rounded text-sm ${toolMode === 'explosion' ? 'bg-green-600' : 'bg-red-600'}`}>
                    💥 Exploder
                  </button>
                </div>
              </div>

              {/* Colliders */}
              <div className="mb-4 bg-gray-800/30 p-4 rounded-lg">
                <h3 className="text-lg font-bold mb-2 text-cyan-400">🏗️ COLLIDERS</h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setColliderMode('none')} 
                          className={`px-3 py-2 rounded text-sm ${colliderMode === 'none' ? 'bg-green-600' : 'bg-gray-600'}`}>
                    ❌ None
                  </button>
                  <button onClick={() => setColliderMode('platform')} 
                          className={`px-3 py-2 rounded text-sm ${colliderMode === 'platform' ? 'bg-green-600' : 'bg-amber-600'}`}>
                    🟫 Platform
                  </button>
                  <button onClick={() => setColliderMode('bouncer')} 
                          className={`px-3 py-2 rounded text-sm ${colliderMode === 'bouncer' ? 'bg-green-600' : 'bg-pink-600'}`}>
                    ⚡ Super Bouncer
                  </button>
                  <button onClick={() => setColliderMode('magnet')} 
                          className={`px-3 py-2 rounded text-sm ${colliderMode === 'magnet' ? 'bg-green-600' : 'bg-blue-600'}`}>
                    🧲 Magnet
                  </button>
                  <button onClick={() => setColliderMode('destroyer')} 
                          className={`px-3 py-2 rounded text-sm ${colliderMode === 'destroyer' ? 'bg-green-600' : 'bg-red-600'}`}>
                    💀 Destroyer
                  </button>
                  <button onClick={() => setColliderMode('portal')} 
                          className={`px-3 py-2 rounded text-sm ${colliderMode === 'portal' ? 'bg-green-600' : 'bg-purple-600'}`}>
                    🌀 Portal
                  </button>
                  <button onClick={() => setColliderMode('spinner')} 
                          className={`px-3 py-2 rounded text-sm ${colliderMode === 'spinner' ? 'bg-green-600' : 'bg-green-600'}`}>
                    🌪️ Spinner
                  </button>
                </div>
              </div>

              {/* Stats */}
              {showStats && (
                <div className="mb-4 bg-black/50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-red-400">{fps}</div>
                      <div className="text-sm">FPS</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-400">{particleCount}</div>
                      <div className="text-sm">Particles</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-400">{highScore.particles}</div>
                      <div className="text-sm">High Score</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-400">{collidersRef.current.length}</div>
                      <div className="text-sm">Colliders</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Physics Canvas */}
              <div className="relative">
                <div 
                  ref={sceneRef} 
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className="border-2 border-purple-500/50 mx-auto cursor-crosshair rounded-lg overflow-hidden bg-gradient-to-b from-gray-900 to-black"
                  style={{ width: '1000px', height: '700px' }}
                />
                <div className="absolute top-2 right-2 text-white text-sm bg-black/50 px-2 py-1 rounded">
                  {toolMode !== 'none' ? `Tool: ${toolMode}` : colliderMode !== 'none' ? `Collider: ${colliderMode}` : 'Click to add particles'}
                </div>
              </div>
            </div>
          </div>
        );
      case 'leaderboard':
        return (
          <div className="py-32 bg-gradient-to-b from-black to-purple-900 min-h-screen text-white">
            <h2 className="text-4xl font-bold text-center mb-8">🏆 LEADERBOARD</h2>
            <div className="max-w-md mx-auto bg-purple-900/30 p-8 rounded-lg text-center border border-purple-500">
              <p className="text-2xl mb-4">🥇 High Score</p>
              <p className="text-xl">{highScore.particles} particles</p>
              <p className="text-lg text-gray-300">at {highScore.fps} FPS</p>
            </div>
          </div>
        );
      case 'about':
        return (
          <div className="py-32 bg-gradient-to-b from-black to-blue-900 min-h-screen text-white">
            <h2 className="text-4xl font-bold text-center mb-8">🚀 ABOUT</h2>
            <div className="max-w-2xl mx-auto bg-blue-900/30 p-8 rounded-lg text-center border border-blue-500">
              <p className="text-xl mb-4">EXTREME PHYSICS SIMULATOR</p>
              <p className="mb-4">Built with React + Matter.js</p>
              <div className="text-left">
                <p>🔥 Features:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>50,000 particle limit</li>
                  <li>6 particle types with unique physics</li>
                  <li>Advanced tools: Particle gun, explosions, spray</li>
                  <li>Interactive colliders: Magnets, portals, destroyers</li>
                  <li>Real-time physics forces: Wind, magnetism, gravity</li>
                  <li>Performance optimizations</li>
                  <li>Screen shake effects</li>
                  <li>Time scaling controls</li>
                </ul>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-black min-h-screen">
      <Navbar setCurrentPage={setCurrentPage} />
      <main className="pt-16">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
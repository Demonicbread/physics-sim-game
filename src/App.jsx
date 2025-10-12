import { useState, useEffect, useRef, useCallback } from 'react';
import Matter from 'matter-js';
import Navbar from './components/Navbar';

function App() {
  // UI state
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
  const simContainerRef = useRef(null);
  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const particlesRef = useRef([]);
  const collidersRef = useRef([]);
  const portalsRef = useRef([]);
  const portalCooldownRef = useRef(new Map());
  const runnerRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const explosionsRef = useRef([]);
  const magnetsRef = useRef([]);

  // Use refs for live control values inside animation loop
  const windForceRef = useRef(0);
  const magnetStrengthRef = useRef(0);

  useEffect(() => { windForceRef.current = windForce; }, [windForce]);
  useEffect(() => { magnetStrengthRef.current = magnetStrength; }, [magnetStrength]);

  useEffect(() => {
    const saved = localStorage.getItem('highScore');
    if (saved) setHighScore(JSON.parse(saved));
  }, []);

  // Initialize physics engine (only on page enter)
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

    const engine = Matter.Engine.create();
    engineRef.current = engine;
    const world = engine.world;

    // Initial settings
    world.gravity.y = gravity;
    engine.timing.timeScale = timeScale;
    engine.constraintIterations = 2;
    engine.positionIterations = 6;
    engine.velocityIterations = 4;

    // Determine initial renderer size from container
    const container = simContainerRef.current;
    const fallbackWidth = 1000;
    const width = container?.clientWidth || fallbackWidth;
    const height = Math.round((width * 7) / 10);

    const render = Matter.Render.create({
      element: sceneRef.current,
      engine,
      options: {
        width,
        height,
        wireframes: false,
        background: 'transparent',
        showAngleIndicator: false,
        showVelocity: false,
        pixelRatio: window.devicePixelRatio || 1
      }
    });
    renderRef.current = render;

    // World bounds and walls
    const thickness = 30;
    const ground = Matter.Bodies.rectangle(width / 2, height + thickness / 2 - 1, width, thickness, {
      isStatic: true,
      render: { fillStyle: '#2a2a2a' },
      friction: 0.8,
      restitution: 0.3
    });
    const leftWall = Matter.Bodies.rectangle(-thickness / 2, height / 2, thickness, height, {
      isStatic: true,
      render: { fillStyle: '#2a2a2a' }
    });
    const rightWall = Matter.Bodies.rectangle(width + thickness / 2, height / 2, thickness, height, {
      isStatic: true,
      render: { fillStyle: '#2a2a2a' }
    });
    const ceiling = Matter.Bodies.rectangle(width / 2, -thickness / 2, width, thickness, {
      isStatic: true,
      render: { fillStyle: '#2a2a2a' }
    });
    Matter.World.add(world, [ground, leftWall, rightWall, ceiling]);

    // Mouse
    const mouse = Matter.Mouse.create(render.canvas);
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.2, render: { visible: false } }
    });
    Matter.World.add(world, mouseConstraint);

    // Mouse tracking handler
    const onMouseMove = (e) => {
      const rect = render.canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    render.canvas.addEventListener('mousemove', onMouseMove);

    // Collision handling (portals/destroyers)
    const onCollisionStart = (event) => {
      for (const pair of event.pairs) {
        const a = pair.bodyA;
        const b = pair.bodyB;
        handleSensorCollision(a, b);
        handleSensorCollision(b, a);
      }
    };

    const handleSensorCollision = (sensor, other) => {
      if (!sensor.isSensor || !other || !other.isParticle) return;
      // Destroyer: remove particles on contact
      if (sensor.destroyer) {
        Matter.World.remove(engineRef.current.world, other);
        const idx = particlesRef.current.indexOf(other);
        if (idx > -1) particlesRef.current.splice(idx, 1);
        setParticleCount((c) => Math.max(0, c - 1));
        return;
      }
      // Portal: teleport to another portal
      if (sensor.portal && portalsRef.current.length > 1) {
        const now = performance.now();
        const last = portalCooldownRef.current.get(other.id) || 0;
        if (now - last < 150) return;

        const candidates = portalsRef.current.filter((p) => p !== sensor);
        const target = candidates[0];
        if (!target) return;

        const vx = other.velocity.x;
        const vy = other.velocity.y;
        const offset = { x: vx * 4, y: vy * 4 };
        Matter.Body.setPosition(
          other,
          {
            x: (target.position?.x || 0) + offset.x,
            y: (target.position?.y || 0) + offset.y
          }
        );
        portalCooldownRef.current.set(other.id, now);
      }
    };

    Matter.Events.on(engine, 'collisionStart', onCollisionStart);

    // Start engine and renderer
    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);

    // Reset state containers
    particlesRef.current = [];
    collidersRef.current = [];
    portalsRef.current = [];
    explosionsRef.current = [];
    magnetsRef.current = [];
    setParticleCount(0);

    // FPS + forces loop
    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId;

    const physicsLoop = () => {
      const now = performance.now();
      frameCount++;

      // Wind force
      const wf = windForceRef.current;
      if (wf !== 0) {
        particlesRef.current.forEach((p) => {
          Matter.Body.applyForce(p, p.position, { x: wf * 0.001, y: 0 });
        });
      }

      // Magnetic forces
      const ms = magnetStrengthRef.current;
      if (ms !== 0 && magnetsRef.current.length) {
        magnetsRef.current.forEach((mag) => {
          particlesRef.current.forEach((p) => {
            const dx = mag.position.x - p.position.x;
            const dy = mag.position.y - p.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0 && dist < 200) {
              const f = (ms * 0.0001) / (dist * dist);
              Matter.Body.applyForce(p, p.position, { x: dx * f, y: dy * f });
            }
          });
        });
      }

      // Explosions
      explosionsRef.current = explosionsRef.current.filter((ex) => {
        ex.life -= 0.02;
        if (ex.life <= 0) return false;
        particlesRef.current.forEach((p) => {
          const dx = p.position.x - ex.x;
          const dy = p.position.y - ex.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0 && dist < ex.radius) {
            const f = (ex.power * 0.001) / (dist + 1);
            Matter.Body.applyForce(p, p.position, { x: (dx / dist) * f, y: (dy / dist) * f });
          }
        });
        return true;
      });

      // FPS calculation
      if (now - lastTime >= 1000) {
        const currentFps = Math.round((frameCount * 1000) / (now - lastTime));
        setFps(currentFps);
        const currentParticleCount = particlesRef.current.length;
        if (
          currentParticleCount > highScore.particles ||
          (currentParticleCount === highScore.particles && currentFps > highScore.fps)
        ) {
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

    // Resize handling
    const resize = () => {
      const c = simContainerRef.current;
      if (!c || !renderRef.current || !engineRef.current) return;
      const w = c.clientWidth || fallbackWidth;
      const h = Math.round((w * 7) / 10);
      const render = renderRef.current;
      render.options.width = w;
      render.options.height = h;
      render.canvas.width = w;
      render.canvas.height = h;
      Matter.Render.lookAt(render, { min: { x: 0, y: 0 }, max: { x: w, y: h } });
    };
    window.addEventListener('resize', resize);

    // Cleanup
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      if (renderRef.current && renderRef.current.canvas) {
        renderRef.current.canvas.removeEventListener('mousemove', onMouseMove);
      }
      if (renderRef.current) {
        Matter.Render.stop(renderRef.current);
        if (renderRef.current.canvas) renderRef.current.canvas.remove();
      }
      if (runnerRef.current) Matter.Runner.stop(runnerRef.current);
      if (engineRef.current) {
        Matter.World.clear(engineRef.current.world, false);
        Matter.Engine.clear(engineRef.current);
      }
      particlesRef.current = [];
      collidersRef.current = [];
      portalsRef.current = [];
      explosionsRef.current = [];
      magnetsRef.current = [];
      setParticleCount(0);
      setFps(0);
    };
  }, [currentPage]);

  // Mutate gravity without re-init
  useEffect(() => {
    if (engineRef.current) engineRef.current.world.gravity.y = gravity;
  }, [gravity]);

  // Mutate timeScale without re-init
  useEffect(() => {
    if (engineRef.current) engineRef.current.timing.timeScale = timeScale;
  }, [timeScale]);

  // Particle creation
  const createParticle = useCallback(
    (x, y, customProps = {}) => {
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
            render: { fillStyle: `hsl(${Math.random() * 60 + 300}, 100%, 70%)` }
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
        body.isParticle = true;
        if (particleTrails) body.trail = [];
        Matter.World.add(world, body);
        particlesRef.current.push(body);
        setParticleCount((c) => c + 1);
        return body;
      }
      return null;
    },
    [mode, particleSize, color, particleCount, particleTrails]
  );

  const spawnParticles = useCallback(
    (x, y, count = 1, spread = 0) => {
      for (let i = 0; i < count; i++) {
        const ox = (Math.random() - 0.5) * spread;
        const oy = (Math.random() - 0.5) * spread;
        createParticle(x + ox, y + oy);
      }
    },
    [createParticle]
  );

  const fireParticleGun = useCallback(
    (x, y) => {
      const p = createParticle(x, y);
      if (p) {
        const angle = Math.random() * Math.PI * 2;
        const force = 0.02;
        Matter.Body.applyForce(p, p.position, { x: Math.cos(angle) * force, y: Math.sin(angle) * force });
      }
    },
    [createParticle]
  );

  const createExplosion = useCallback(
    (x, y, power = explosionPower) => {
      explosionsRef.current.push({ x, y, power, radius: power * 2, life: 1.0 });
      if (screenShake && sceneRef.current) {
        const intensity = Math.min(power / 50, 10);
        sceneRef.current.style.transform = `translate(${(Math.random() - 0.5) * intensity}px, ${(Math.random() - 0.5) * intensity}px)`;
        setTimeout(() => {
          if (sceneRef.current) sceneRef.current.style.transform = 'translate(0, 0)';
        }, 100);
      }
      const toRemove = particlesRef.current.filter((p) => {
        const dx = p.position.x - x;
        const dy = p.position.y - y;
        const d = Math.sqrt(dx * dx + dy * dy);
        return d < power;
      });
      toRemove.forEach((p) => {
        Matter.World.remove(engineRef.current.world, p);
        const idx = particlesRef.current.indexOf(p);
        if (idx > -1) particlesRef.current.splice(idx, 1);
        setParticleCount((c) => Math.max(0, c - 1));
      });
    },
    [explosionPower, screenShake]
  );

  const createCollider = useCallback(
    (x, y, type) => {
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
          magnetsRef.current.push({ position: { x, y }, strength: magnetStrengthRef.current });
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
          portalsRef.current.push(collider);
          break;
        case 'spinner':
          collider = Matter.Bodies.rectangle(x, y, 100, 20, {
            render: { fillStyle: '#32CD32' },
            frictionAir: 0.01
          });
          Matter.Body.setAngularVelocity(collider, 0.1);
          break;
        default:
          return;
      }
      if (collider) {
        Matter.World.add(world, collider);
        collidersRef.current.push(collider);
      }
    },
    []
  );

  // Mouse interactions
  const handleMouseDown = useCallback(
    (e) => {
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
          if (colliderMode !== 'none') createCollider(x, y, colliderMode);
          else spawnParticles(x, y, 1);
      }
    },
    [toolMode, colliderMode, createExplosion, fireParticleGun, createCollider, spawnParticles]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!isMouseDown) return;
      const rect = sceneRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (toolMode === 'gun') fireParticleGun(x, y);
      else if (toolMode === 'spray' || (toolMode === 'none' && colliderMode === 'none')) spawnParticles(x, y, 1);
    },
    [isMouseDown, toolMode, colliderMode, fireParticleGun, spawnParticles]
  );

  const handleMouseUp = useCallback(() => setIsMouseDown(false), []);

  // Utilities
  const clearWorld = useCallback(() => {
    if (!engineRef.current) return;
    const world = engineRef.current.world;
    [...particlesRef.current, ...collidersRef.current].forEach((b) => Matter.World.remove(world, b));
    particlesRef.current = [];
    collidersRef.current = [];
    portalsRef.current = [];
    explosionsRef.current = [];
    magnetsRef.current = [];
    setParticleCount(0);
  }, []);

  const stressTest = useCallback(() => {
    const centerX = (renderRef.current?.options?.width || 1000) / 2;
    const centerY = 100;
    spawnParticles(centerX, centerY, 500, 200);
  }, [spawnParticles]);

  const megaStressTest = useCallback(() => {
    const centerX = (renderRef.current?.options?.width || 1000) / 2;
    const centerY = 100;
    spawnParticles(centerX, centerY, 2000, 300);
  }, [spawnParticles]);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <div className="flex items-center justify-center min-h-screen pt-16 px-4 relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
              <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-6xl mx-auto text-center space-y-12 relative z-10">
              <div className="space-y-6">
                <h1 className="text-7xl md:text-9xl font-extrabold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-transparent bg-clip-text tracking-tight leading-none">
                  PhysicsBox
                </h1>
                <h2 className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 text-transparent bg-clip-text tracking-tight">
                  A Physics Sandbox
                </h2>
                <p className="text-xl text-slate-300 max-w-2xl mx-auto">An advanced browser-based physics simulation</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
                <div className="card p-6 hover:bg-white/10 hover:scale-105 transition-all duration-300 group">
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🔥</div>
                  <div className="font-bold text-lg mb-1">50,000 Particles</div>
                  <div className="text-sm text-slate-400">Large particle limit</div>
                </div>
                <div className="card p-6 hover:bg-white/10 hover:scale-105 transition-all duration-300 group">
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">💥</div>
                  <div className="font-bold text-lg mb-1">Explosive Physics</div>
                  <div className="text-sm text-slate-400">Real-time explosions</div>
                </div>
                <div className="card p-6 hover:bg-white/10 hover:scale-105 transition-all duration-300 group">
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🧲</div>
                  <div className="font-bold text-lg mb-1">Magnetic Forces</div>
                  <div className="text-sm text-slate-400">Dynamic attraction</div>
                </div>
                <div className="card p-6 hover:bg-white/10 hover:scale-105 transition-all duration-300 group">
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">⚡</div>
                  <div className="font-bold text-lg mb-1">High Performance</div>
                  <div className="text-sm text-slate-400">Optimized engine</div>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => setCurrentPage('game')}
                  className="btn bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 hover:from-red-600 hover:via-purple-600 hover:to-blue-600 text-white px-16 py-5 text-2xl font-extrabold rounded-2xl shadow-2xl hover:shadow-purple-500/50 hover:scale-110 transform transition-all duration-300"
                >
                  START SANDBOX
                </button>
                <p className="text-sm text-slate-400">No installation required • Works in any modern browser</p>
              </div>

              <div className="flex justify-center gap-8 text-center pt-8 border-t border-white/10">
                <div>
                  <div className="text-3xl font-bold text-purple-400">6</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Particle Types</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-cyan-400">7</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Collider Types</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-pink-400">4</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Advanced Tools</div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'game':
        return (
          <div className="pt-16 py-12 min-h-screen text-white px-4 flex flex-col">
            <h2 className="text-4xl font-extrabold text-center mb-6 bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text tracking-tight">
              PhysicsBox Sandbox
            </h2>

            <div className="max-w-7xl mx-auto space-y-4 flex-grow flex flex-col">
              <div className="toolbar justify-center gap-3">
                <select value={mode} onChange={(e) => setMode(e.target.value)} className="p-2 bg-slate-800 text-white rounded border border-purple-500/50">
                  <option value="balls">Bouncing Balls</option>
                  <option value="sand">Falling Sand</option>
                  <option value="water">Water Drops</option>
                  <option value="plasma">Plasma Energy</option>
                  <option value="metal">Metal Chunks</option>
                  <option value="explosive">Explosives</option>
                </select>
                <button onClick={() => spawnParticles((renderRef.current?.options?.width || 1000) / 2, 100, 1)} className="btn-primary">Add Particle</button>
                <button onClick={stressTest} className="btn-warning">Stress Test (500)</button>
                <button onClick={megaStressTest} className="btn-danger">MEGA TEST (2000)</button>
                <button onClick={clearWorld} className="btn btn-ghost">Clear All</button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="control-group">
                  <label className="block text-xs uppercase tracking-wide text-slate-300 mb-1">Gravity: {gravity}</label>
                  <input type="range" min="-2" max="3" step="0.1" value={gravity} onChange={(e) => setGravity(parseFloat(e.target.value))} className="w-full" />
                </div>
                <div className="control-group">
                  <label className="block text-xs uppercase tracking-wide text-slate-300 mb-1">Size: {particleSize}</label>
                  <input type="range" min="1" max="30" value={particleSize} onChange={(e) => setParticleSize(parseInt(e.target.value))} className="w-full" />
                </div>
                <div className="control-group">
                  <label className="block text-xs uppercase tracking-wide text-slate-300 mb-1">Wind: {windForce}</label>
                  <input type="range" min="-50" max="50" value={windForce} onChange={(e) => setWindForce(parseInt(e.target.value))} className="w-full" />
                </div>
                <div className="control-group">
                  <label className="block text-xs uppercase tracking-wide text-slate-300 mb-1">Magnet: {magnetStrength}</label>
                  <input type="range" min="-100" max="100" value={magnetStrength} onChange={(e) => setMagnetStrength(parseInt(e.target.value))} className="w-full" />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="control-group">
                  <label className="block text-xs uppercase tracking-wide text-slate-300 mb-1">Time: {timeScale}</label>
                  <input type="range" min="0.1" max="3" step="0.1" value={timeScale} onChange={(e) => setTimeScale(parseFloat(e.target.value))} className="w-full" />
                </div>
                <div className="control-group">
                  <label className="block text-xs uppercase tracking-wide text-slate-300 mb-1">Explosion: {explosionPower}</label>
                  <input type="range" min="10" max="200" value={explosionPower} onChange={(e) => setExplosionPower(parseInt(e.target.value))} className="w-full" />
                </div>
                <div className="control-group">
                  <label className="block text-xs uppercase tracking-wide text-slate-300 mb-1">Color</label>
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-full h-8 rounded" />
                </div>
                <div className="control-group flex items-center justify-center">
                  <button onClick={() => setScreenShake(!screenShake)} className={`btn ${screenShake ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-700 hover:bg-slate-600'}`}>
                    Screen Shake
                  </button>
                </div>
              </div>

              <div className="card p-4">
                <h3 className="text-sm font-bold mb-2 text-purple-300 uppercase tracking-wide">Tools</h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setToolMode('none')} className={`btn ${toolMode === 'none' ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-700 hover:bg-slate-600'}`}>Normal</button>
                  <button onClick={() => setToolMode('spray')} className={`btn ${toolMode === 'spray' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-700 hover:bg-blue-600'}`}>Spray</button>
                  <button onClick={() => setToolMode('gun')} className={`btn ${toolMode === 'gun' ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-700 hover:bg-yellow-600'}`}>Particle Gun</button>
                  <button onClick={() => setToolMode('explosion')} className={`btn ${toolMode === 'explosion' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-700 hover:bg-red-600'}`}>Exploder</button>
                </div>
              </div>

              <div className="card p-4">
                <h3 className="text-sm font-bold mb-2 text-cyan-300 uppercase tracking-wide">Colliders</h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setColliderMode('none')} className={`btn ${colliderMode === 'none' ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-700 hover:bg-slate-600'}`}>None</button>
                  <button onClick={() => setColliderMode('platform')} className={`btn ${colliderMode === 'platform' ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-700 hover:bg-amber-600'}`}>Platform</button>
                  <button onClick={() => setColliderMode('bouncer')} className={`btn ${colliderMode === 'bouncer' ? 'bg-green-600 hover:bg-green-700' : 'bg-pink-700 hover:bg-pink-600'}`}>Super Bouncer</button>
                  <button onClick={() => setColliderMode('magnet')} className={`btn ${colliderMode === 'magnet' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-700 hover:bg-blue-600'}`}>Magnet</button>
                  <button onClick={() => setColliderMode('destroyer')} className={`btn ${colliderMode === 'destroyer' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-700 hover:bg-red-600'}`}>Destroyer</button>
                  <button onClick={() => setColliderMode('portal')} className={`btn ${colliderMode === 'portal' ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-700 hover:bg-purple-600'}`}>Portal</button>
                  <button onClick={() => setColliderMode('spinner')} className={`btn ${colliderMode === 'spinner' ? 'bg-green-600 hover:bg-green-700' : 'bg-green-700 hover:bg-green-600'}`}>Spinner</button>
                </div>
              </div>

              {showStats && (
                <div className="card p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-extrabold text-red-400">{fps}</div>
                      <div className="text-xs uppercase tracking-wide text-slate-300">FPS</div>
                    </div>
                    <div>
                      <div className="text-2xl font-extrabold text-blue-400">{particleCount}</div>
                      <div className="text-xs uppercase tracking-wide text-slate-300">Particles</div>
                    </div>
                    <div>
                      <div className="text-2xl font-extrabold text-green-400">{highScore.particles}</div>
                      <div className="text-xs uppercase tracking-wide text-slate-300">High Score</div>
                    </div>
                    <div>
                      <div className="text-2xl font-extrabold text-purple-400">{collidersRef.current.length}</div>
                      <div className="text-xs uppercase tracking-wide text-slate-300">Colliders</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="card p-2 overflow-y-auto">
                <div
                  ref={simContainerRef}
                  className="mx-auto w-full max-w-[1000px] aspect-[10/7]"
                >
                  <div
                    ref={sceneRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className="border-2 border-purple-500/30 mx-auto cursor-crosshair rounded-lg overflow-hidden w-full h-full"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 'leaderboard':
        return (
          <div className="pt-16 py-12 min-h-screen text-white">
            <h2 className="text-4xl font-extrabold text-center mb-8">Leaderboard</h2>
            <div className="max-w-md mx-auto card p-8 text-center">
              <p className="text-2xl mb-4">High Score</p>
              <p className="text-xl">{highScore.particles} particles</p>
              <p className="text-lg text-slate-300">at {highScore.fps} FPS</p>
            </div>
          </div>
        );
      case 'about':
        return (
          <div className="pt-16 py-12 min-h-screen text-white">
            <h2 className="text-4xl font-extrabold text-center mb-8">About</h2>
            <div className="max-w-2xl mx-auto card p-8 text-center">
              <p className="text-xl mb-4">PhysicsBox</p>
              <p className="mb-4">Built with React + Matter.js</p>
              <div className="text-left">
                <ul className="list-disc list-inside mt-2 space-y-1 text-slate-300">
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
    <div className="min-h-screen flex flex-col h-screen">
      <Navbar setCurrentPage={setCurrentPage} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;

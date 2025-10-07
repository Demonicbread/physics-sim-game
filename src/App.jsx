import { useState, useEffect, useRef } from 'react';
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
  const [bgColor, setBgColor] = useState('#000000');
  const [highScore, setHighScore] = useState({ particles: 0, fps: 0 });

  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const particlesRef = useRef([]);
  const runnerRef = useRef(null);

  useEffect(() => {
    // Load high score
    const saved = localStorage.getItem('highScore');
    if (saved) {
      setHighScore(JSON.parse(saved));
    }
  }, []);

  // Initialize physics engine only when on game page
  useEffect(() => {
    if (currentPage !== 'game' || !sceneRef.current) return;

    // Clean up existing engine if any
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

    // Create new engine
    const engine = Matter.Engine.create();
    engineRef.current = engine;
    const world = engine.world;

    // Set gravity
    world.gravity.y = gravity;

    // Create renderer
    const render = Matter.Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: 800,
        height: 600,
        wireframes: false,
        background: 'transparent',
        showAngleIndicator: false,
        showVelocity: false
      }
    });
    renderRef.current = render;

    // Add boundaries
    const ground = Matter.Bodies.rectangle(400, 590, 800, 20, { 
      isStatic: true, 
      render: { fillStyle: '#666' } 
    });
    const leftWall = Matter.Bodies.rectangle(0, 300, 20, 600, { 
      isStatic: true, 
      render: { fillStyle: '#666' } 
    });
    const rightWall = Matter.Bodies.rectangle(800, 300, 20, 600, { 
      isStatic: true, 
      render: { fillStyle: '#666' } 
    });
    
    Matter.World.add(world, [ground, leftWall, rightWall]);

    // Add mouse control
    const mouse = Matter.Mouse.create(render.canvas);
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false }
      }
    });
    Matter.World.add(world, mouseConstraint);

    // Create runner for better performance
    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    
    // Start engine and renderer
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);

    // Reset particle count
    particlesRef.current = [];
    setParticleCount(0);

    // FPS Calculation Loop
    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId;

    const updateFPS = () => {
      const now = performance.now();
      frameCount++;
      if (now - lastTime >= 1000) {
        const currentFps = Math.round((frameCount * 1000) / (now - lastTime));
        setFps(currentFps);

        // Update high score
        const currentParticleCount = particlesRef.current.length;
        if (currentParticleCount > highScore.particles || (currentParticleCount === highScore.particles && currentFps > highScore.fps)) {
          const newHigh = { particles: currentParticleCount, fps: currentFps };
          setHighScore(newHigh);
          localStorage.setItem('highScore', JSON.stringify(newHigh));
        }

        frameCount = 0;
        lastTime = now;
      }
      animationFrameId = requestAnimationFrame(updateFPS);
    };
    updateFPS();

    // Cleanup function
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
      setParticleCount(0);
      setFps(0);
    };
  }, [currentPage, gravity]);

  
  const addParticle = () => {
    if (!engineRef.current || particleCount >= 1000) return;
    const world = engineRef.current.world;
    const x = Math.random() * 800;
    const y = Math.random() * 100;
    addParticleAt(x, y);
  };

  const addParticleAt = (x, y) => {
    if (!engineRef.current || particleCount >= 1000) return;
    const world = engineRef.current.world;
    let body;
    switch (mode) {
      case 'balls':
        body = Matter.Bodies.circle(x, y, particleSize, {
          render: { fillStyle: color },
          restitution: 0.8
        });
        break;
      case 'sand':
        body = Matter.Bodies.rectangle(x, y, particleSize * 2, particleSize * 2, {
          render: { fillStyle: color },
          friction: 0.9,
          frictionStatic: 1
        });
        break;
      case 'water':
        body = Matter.Bodies.circle(x, y, particleSize, {
          render: { fillStyle: color },
          friction: 0.1,
          restitution: 0.1
        });
        break;
      case 'rigid':
        body = Matter.Bodies.rectangle(x, y, particleSize * 3, particleSize * 2, {
          render: { fillStyle: color }
        });
        break;
      default:
        body = Matter.Bodies.circle(x, y, particleSize, {
          render: { fillStyle: color },
          restitution: 0.8
        });
    }
    if (body) {
      Matter.World.add(world, body);
      particlesRef.current.push(body);
      setParticleCount(prev => prev + 1);
    }
  };

  const clearWorld = () => {
    if (!engineRef.current) return;
    const world = engineRef.current.world;
    particlesRef.current.forEach(p => Matter.World.remove(world, p));
    particlesRef.current = [];
    setParticleCount(0);
  };

  const stressTest = () => {
    for (let i = 0; i < 100; i++) {
      addParticle();
    }
  };

  const handleSceneClick = (e) => {
    if (!sceneRef.current) return;
    const rect = sceneRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    addParticleAt(x, y);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <div className="text-center py-32 bg-gradient-to-b from-black to-gray-900 min-h-screen text-white">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text mb-4">
              Physics Sim Game
            </h1>
            <p className="text-xl mb-8">Test your CPU with stunning physics simulations</p>
            <button
              onClick={() => setCurrentPage('game')}
              className="bg-gradient-to-r from-cyan-400 to-purple-500 text-white px-8 py-3 rounded-lg font-semibold cursor-pointer hover:opacity-80"
            >
              Start Playing
            </button>
          </div>
        );
      case 'game':
        return (
          <div className="py-32 bg-gradient-to-b from-black to-gray-900 min-h-screen text-white">
            <h2 className="text-4xl font-bold text-center mb-8">Simulation</h2>
            <div className="max-w-4xl mx-auto bg-white/10 p-8 rounded-lg">
              <div className="mb-4 flex flex-wrap gap-4 items-center">
                <select value={mode} onChange={(e) => setMode(e.target.value)} className="p-2">
                  <option value="balls">Bouncing Balls</option>
                  <option value="sand">Falling Sand</option>
                  <option value="water">Water Simulation</option>
                  <option value="rigid">Rigid Bodies</option>
                </select>
                <button onClick={addParticle} className="px-4 py-2 cursor-pointer bg-blue-500 rounded">Add Particle</button>
                <button onClick={clearWorld} className="px-4 py-2 cursor-pointer bg-red-500 rounded">Clear</button>
                <button onClick={stressTest} className="px-4 py-2 cursor-pointer bg-yellow-500 rounded">Stress Test</button>
                <label className="flex items-center">
                  Gravity: <input type="range" min="0" max="2" step="0.1" value={gravity} onChange={(e) => setGravity(parseFloat(e.target.value))} className="ml-2" />
                </label>
                <label className="flex items-center">
                  Size: <input type="range" min="1" max="20" value={particleSize} onChange={(e) => setParticleSize(parseInt(e.target.value))} className="ml-2" />
                </label>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
                <div className="font-bold text-red-500">FPS: {fps}</div>
                <div className="font-bold">Particles: {particleCount}</div>
              </div>
              <div ref={sceneRef} onClick={handleSceneClick} className="border border-gray-300 mx-auto cursor-crosshair" style={{ width: '800px', height: '600px' }} />
            </div>
          </div>
        );
      case 'leaderboard':
        return (
          <div className="py-32 bg-gradient-to-b from-black to-gray-900 min-h-screen text-white">
            <h2 className="text-4xl font-bold text-center mb-8">Leaderboard</h2>
            <div className="max-w-md mx-auto bg-white/10 p-8 rounded-lg text-center">
              <p>High Score: {highScore.particles} particles at {highScore.fps} FPS</p>
            </div>
          </div>
        );
      case 'about':
        return (
          <div className="py-32 bg-gradient-to-b from-black to-gray-900 min-h-screen text-white">
            <h2 className="text-4xl font-bold text-center mb-8">About</h2>
            <div className="max-w-md mx-auto bg-white/10 p-8 rounded-lg text-center">
              <p>This game uses advanced physics engines to stress test your CPU.</p>
              <p>Built with React, Three.js, and Matter.js.</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gradient-to-b from-black to-gray-900 min-h-screen">
      <Navbar setCurrentPage={setCurrentPage} />
      <main className="pt-16">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;

import { useState, useEffect, useRef, useCallback } from "react";
import Matter from "matter-js";
import Navbar from "./components/Navbar";
import GameModeSelector from "./components/GameModeSelector";
import GameHUD from "./components/GameHUD";
import { CHALLENGE_LEVELS, REACTION_LEVELS } from "./utils/gameModes";
import useSurvivalMode from "./hooks/useSurvivalMode";
import translations from "./translations";

function App() {
  // UI state
  const [currentPage, setCurrentPage] = useState("home");
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const [fps, setFps] = useState(0);
  const [particleCount, setParticleCount] = useState(0);
  const [mode, setMode] = useState("balls");
  const [gravity, setGravity] = useState(1);
  const [particleSize, setParticleSize] = useState(5);
  const [color, setColor] = useState("#ff0000");
  const [highScore, setHighScore] = useState({ particles: 0, fps: 0 });

  // Game mode state
  const [gameMode, setGameMode] = useState("sandbox");
  const [currentLevel, setCurrentLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [objective, setObjective] = useState(null);
  const [gameState, setGameState] = useState("playing");
  const [wave, setWave] = useState(1);
  const [combo, setCombo] = useState(0);
  const [collectedParticles, setCollectedParticles] = useState({
    red: 0,
    blue: 0,
    green: 0,
    yellow: 0,
  });
  const [chainReactions, setChainReactions] = useState(0);
  const [explosionsUsed, setExplosionsUsed] = useState(0);
  const [maxExplosions, setMaxExplosions] = useState(5);
  const [particleBudget, setParticleBudget] = useState(Infinity);
  const [particlesSpawned, setParticlesSpawned] = useState(0);
  const [colliderLimit, setColliderLimit] = useState(10);
  const [collidersPlaced, setCollidersPlaced] = useState(0);
  const [waveCountdown, setWaveCountdown] = useState(0);

  // Advanced physics states
  const [colliderMode, setColliderMode] = useState("none");
  const [toolMode, setToolMode] = useState("none");
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [windForce, setWindForce] = useState(0);
  const [magnetStrength, setMagnetStrength] = useState(0);
  const [collectionMagnetStrength, setCollectionMagnetStrength] = useState(100);
  const [explosionPower, setExplosionPower] = useState(50);
  const [particleTrails, setParticleTrails] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [timeScale, setTimeScale] = useState(1);
  // Legacy state for dragged particle (kept for compatibility but not used in new pointer-based dragging)
  const [draggedParticle, setDraggedParticle] = useState(null);
  const [dragMagnetStrength, setDragMagnetStrength] = useState(0);

  // New refs for improved dragging performance (avoids React re-renders during drag)
  const draggedRef = useRef(null); // Currently dragged particle (ref for performance)
  const dragOffsetRef = useRef({ x: 0, y: 0 }); // Offset between pointer and particle center
  const [renderTick, setRenderTick] = useState(0); // Trigger for manual redraws if needed
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
  const goalZonesRef = useRef([]);
  const coreRef = useRef(null);
  const gameTimerRef = useRef(null);
  const lastComboTimeRef = useRef(0);
  const constraintsRef = useRef([]);
  const roundIdRef = useRef(0);
  const rewardGrantedRef = useRef(null);
  const draggedColliderRef = useRef(null);
  const currentGameStateRef = useRef(gameState);

  const windForceRef = useRef(0);
  const magnetStrengthRef = useRef(0);

  useEffect(() => {
    windForceRef.current = windForce;
  }, [windForce]);
  useEffect(() => {
    magnetStrengthRef.current = magnetStrength;
  }, [magnetStrength]);
  useEffect(() => {
    currentGameStateRef.current = gameState;
  }, [gameState]);



  useEffect(() => {
    const saved = localStorage.getItem("highScore");
    if (saved) setHighScore(JSON.parse(saved));
    const savedCoins = localStorage.getItem("totalCoins");
    if (savedCoins) setCoins(parseInt(savedCoins));
    const savedLanguage = localStorage.getItem("language");
    if (savedLanguage) setCurrentLanguage(savedLanguage);
  }, []);

  const createParticle = useCallback(
    (x, y, customProps = {}) => {
      if (!engineRef.current || particleCount >= 50000) return null;
      if (particlesSpawned >= particleBudget && gameMode !== "sandbox")
        return null;

      const world = engineRef.current.world;
      let body;
      const baseProps = {
        render: { fillStyle: color },
        frictionAir: 0.01,
        ...customProps,
      };

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
        case "water":
          body = Matter.Bodies.circle(x, y, particleSize * 0.8, {
            ...baseProps,
            friction: 0.0001,
            restitution: 0.0,
            density: 0.0008,
            frictionAir: 0.02,
          });
          break;
        case "plasma":
          body = Matter.Bodies.circle(x, y, particleSize, {
            ...baseProps,
            restitution: 1,
            density: 0.0005,
            frictionAir: 0.005,
            render: {
              fillStyle: `hsl(${Math.random() * 60 + 300}, 100%, 70%)`,
            },
          });
          break;
        case "metal":
          body = Matter.Bodies.rectangle(
            x,
            y,
            particleSize * 2,
            particleSize * 2,
            {
              ...baseProps,
              density: 0.01,
              friction: 0.9,
              restitution: 0.3,
              render: { fillStyle: "#C0C0C0" },
            }
          );
          break;
        case "explosive":
          body = Matter.Bodies.circle(x, y, particleSize, {
            ...baseProps,
            restitution: 0.6,
            density: 0.001,
            render: { fillStyle: "#FF4500" },
            explosive: true,
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
        if (gameMode !== "sandbox" && !customProps.isEnemy) {
          setParticlesSpawned((p) => p + 1);
        }
        return body;
      }
      return null;
    },
    [
      mode,
      particleSize,
      color,
      particleCount,
      particleTrails,
      particlesSpawned,
      particleBudget,
      gameMode,
    ]
  );

  // Survival Mode Hook
  const { handleSurvivalCollision } = useSurvivalMode({
    gameMode,
    gameState,
    setGameState,
    currentPage,
    engineRef,
    renderRef,
    coreRef,
    createParticle,
    setScore,
    lives,
    setLives,
    wave,
    setWave,
    waveCountdown,
    setWaveCountdown,
    setObjective,
  });

  // Initialize game mode
  const initializeGameMode = useCallback(
    (mode) => {
      setScore(0);
      setLives(3);
      setWave(1);
      setCombo(0);
      setCollectedParticles({ red: 0, blue: 0, green: 0, yellow: 0 });
      setChainReactions(0);
      setExplosionsUsed(0);
      setParticlesSpawned(0);
      setCollidersPlaced(0);
      setGameState("playing");
      setColliderMode("none");
      setToolMode("none");
      roundIdRef.current += 1;
      rewardGrantedRef.current = null;
      // Reset portal teleport cooldowns for new round
      portalCooldownRef.current.clear();

      switch (mode) {
        case "challenge":
          const level = CHALLENGE_LEVELS[currentLevel - 1];
          setObjective({
            description: level.objective,
            target: level.target,
            progress: 0,
          });
          setTimeRemaining(level.timeLimit);
          setParticleBudget(level.particleBudget);
          setColliderLimit(10);
          break;
        case "survival":
          setMode("balls");
          setObjective({
            description: "Defend your core from particle waves!",
            target: 10, // Corresponds to the 10 waves
            progress: wave - 1,
          });
          setWaveCountdown(0);
          setColliderLimit(4);
          setParticleBudget(Infinity);
          setTimeRemaining(null);
          break;
        case "collection":
          setObjective({
            description: "Sort particles into matching colored zones",
            target: 50,
            progress: 0,
          });
          setTimeRemaining(90);
          setColliderLimit(0); // No colliders in collection mode
          break;
        case "reaction":
          const reactionLevel =
            REACTION_LEVELS[
              Math.min(currentLevel - 1, REACTION_LEVELS.length - 1)
            ];
          setObjective({
            description: `Destroy ${reactionLevel.target} particles with chain reactions`,
            target: reactionLevel.target,
            progress: 0,
          });
          setMaxExplosions(reactionLevel.maxExplosions);
          setTimeRemaining(null);
          setParticleBudget(Infinity);
          setColliderLimit(0); // No colliders in reaction mode
          break;
        default:
          setObjective(null);
          setTimeRemaining(null);
          setParticleBudget(Infinity);
          setColliderLimit(Infinity);
      }
    },
    [currentLevel]
  );

  // Game timer
  useEffect(() => {
    if (currentPage !== "game" || gameState !== "playing") return;
    if (timeRemaining === null || gameMode === "sandbox") return;

    gameTimerRef.current = setInterval(() => {
      setTimeRemaining((t) => {
        if (t <= 1) {
          setGameState("lost");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    };
  }, [currentPage, gameState, timeRemaining, gameMode]);

  // Collection mode spawner
  useEffect(() => {
    if (
      gameMode !== "collection" ||
      gameState !== "playing" ||
      currentPage !== "game"
    )
      return;

    const spawnInterval = setInterval(() => {
      if (!renderRef.current) return;
      const width = renderRef.current.options.width;
      const colors = ["#FF0000", "#0000FF", "#00FF00", "#FFFF00"];
      const colorNames = ["red", "blue", "green", "yellow"];
      const colorIndex = Math.floor(Math.random() * 4);

      const x = width / 2 + (Math.random() - 0.5) * 200;
      const y = 50;

      createParticle(x, y, {
        render: { fillStyle: colors[colorIndex] },
        collectionColor: colorNames[colorIndex],
        restitution: 0.6,
      });
    }, 1500);

    return () => clearInterval(spawnInterval);
  }, [gameMode, gameState, currentPage, createParticle]);

  // Initialize physics engine
  useEffect(() => {
    if (
      (currentPage !== "game" && currentPage !== "sandbox") ||
      !sceneRef.current
    )
      return;

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

    world.gravity.y = gravity;
    engine.timing.timeScale = timeScale;
    engine.constraintIterations = 2;
    engine.positionIterations = 6;
    engine.velocityIterations = 4;

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
        background: "transparent",
        showAngleIndicator: false,
        showVelocity: false,
        pixelRatio: window.devicePixelRatio || 1,
      },
    });
    renderRef.current = render;

    // World bounds
    const thickness = 30;
    const ground = Matter.Bodies.rectangle(
      width / 2,
      height + thickness / 2 - 1,
      width,
      thickness,
      {
        isStatic: true,
        render: { fillStyle: "#2a2a2a" },
        friction: 0.8,
        restitution: 0.3,
      }
    );
    const leftWall = Matter.Bodies.rectangle(
      -thickness / 2,
      height / 2,
      thickness,
      height,
      {
        isStatic: true,
        render: { fillStyle: "#2a2a2a" },
      }
    );
    const rightWall = Matter.Bodies.rectangle(
      width + thickness / 2,
      height / 2,
      thickness,
      height,
      {
        isStatic: true,
        render: { fillStyle: "#2a2a2a" },
      }
    );
    const ceiling = Matter.Bodies.rectangle(
      width / 2,
      -thickness / 2,
      width,
      thickness,
      {
        isStatic: true,
        render: { fillStyle: "#2a2a2a" },
      }
    );
    Matter.World.add(world, [ground, leftWall, rightWall, ceiling]);

    // Game mode specific setup
    if (gameMode === "challenge") {
      // Create goal zone for challenge mode only
      const goalZone = Matter.Bodies.rectangle(
        width / 2,
        height - 80,
        200,
        60,
        {
          isStatic: true,
          isSensor: true,
          render: { fillStyle: "#00FF0080" },
          isGoalZone: true,
        }
      );
      Matter.World.add(world, goalZone);
      goalZonesRef.current = [goalZone];
    }

    if (gameMode === "collection") {
      // Create colored zones in corners
      const zoneSize = 120;
      const zones = [
        { x: zoneSize / 2, y: zoneSize / 2, color: "#FF000080", name: "red" },
        {
          x: width - zoneSize / 2,
          y: zoneSize / 2,
          color: "#0000FF80",
          name: "blue",
        },
        {
          x: zoneSize / 2,
          y: height - zoneSize / 2,
          color: "#00FF0080",
          name: "green",
        },
        {
          x: width - zoneSize / 2,
          y: height - zoneSize / 2,
          color: "#FFFF0080",
          name: "yellow",
        },
      ];

      zones.forEach((zone) => {
        const body = Matter.Bodies.rectangle(
          zone.x,
          zone.y,
          zoneSize,
          zoneSize,
          {
            isStatic: true,
            isSensor: true,
            render: { fillStyle: zone.color },
            isColorZone: true,
            zoneName: zone.name,
          }
        );
        Matter.World.add(world, body);
        goalZonesRef.current.push(body);
      });
    }

    if (gameMode === "survival") {
      // Create core to defend
      const core = Matter.Bodies.circle(width / 2, height / 2, 40, {
        isStatic: true,
        render: { fillStyle: "#00FFFF" },
        isCore: true,
      });
      Matter.World.add(world, core);
      coreRef.current = core;
    }

    if (gameMode === "reaction") {
      // Pre-spawn particles in a grid
      const reactionLevel =
        REACTION_LEVELS[Math.min(currentLevel - 1, REACTION_LEVELS.length - 1)];
      const cols = Math.ceil(Math.sqrt(reactionLevel.particleCount));
      const rows = Math.ceil(reactionLevel.particleCount / cols);
      const spacing = Math.min(width / (cols + 1), height / (rows + 1));

      for (let i = 0; i < reactionLevel.particleCount; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = (col + 1) * spacing + (Math.random() - 0.5) * 20;
        const y = (row + 1) * spacing + (Math.random() - 0.5) * 20;
        createParticle(x, y, {
          render: { fillStyle: "#FF4500" },
          explosive: true,
          exploded: false, // Track if already exploded to prevent double-counting
        });
      }
    }

    const mouse = Matter.Mouse.create(render.canvas);
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false },
      },
    });
    Matter.World.add(world, mouseConstraint);

    const onMouseMove = (e) => {
      const rect = render.canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    render.canvas.addEventListener("mousemove", onMouseMove);

    // Pointer events for improved dragging in collection mode
    // Uses pointer events for cross-device support (mouse, touch, pen)
    const onPointerDown = (e) => {
      if (gameMode !== "collection") return; // Only active in collection mode
      e.preventDefault(); // Prevent default browser behavior
      e.stopPropagation(); // Prevent event bubbling

      const rect = render.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left; // Convert client coords to canvas coords
      const y = e.clientY - rect.top;

      // Find particle under pointer (30px radius hit detection)
      const particle = particlesRef.current.find((p) => {
        const dx = p.position.x - x;
        const dy = p.position.y - y;
        const distSq = dx * dx + dy * dy; // Squared distance for performance
        return distSq <= 900; // 30^2 = 900
      });

      if (particle) {
        console.log("Picked particle id:", particle.id); // Debug log
        draggedRef.current = particle; // Store dragged particle in ref
        dragOffsetRef.current = { x: x - particle.position.x, y: y - particle.position.y }; // Calculate offset
        e.target.setPointerCapture(e.pointerId); // Capture pointer for drag outside canvas
      }
    };

    const onPointerMove = (e) => {
      if (gameMode !== "collection" || !draggedRef.current) return; // Only if dragging in collection mode
      e.preventDefault(); // Prevent scrolling/selection

      const rect = render.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left; // Canvas coordinates
      const y = e.clientY - rect.top;

      // Calculate target position with offset maintained
      const targetX = x - dragOffsetRef.current.x;
      const targetY = y - dragOffsetRef.current.y;

      // Smooth lerp toward target for natural feel (0.3 = 30% toward target each frame)
      const lerpFactor = 0.3;
      draggedRef.current.position.x += (targetX - draggedRef.current.position.x) * lerpFactor;
      draggedRef.current.position.y += (targetY - draggedRef.current.position.y) * lerpFactor;

      setRenderTick(t => t + 1); // Trigger React redraw (though Matter.js handles rendering)
    };

    const onPointerUp = (e) => {
      if (gameMode !== "collection") return; // Only in collection mode
      e.preventDefault(); // Prevent default behavior

      if (draggedRef.current) {
        console.log("Released particle id:", draggedRef.current.id); // Debug log
        draggedRef.current = null; // Clear dragged particle
        dragOffsetRef.current = { x: 0, y: 0 }; // Reset offset
      }

      // Release pointer capture if active
      if (e.target.hasPointerCapture && e.target.hasPointerCapture(e.pointerId)) {
        e.target.releasePointerCapture(e.pointerId);
      }
    };

    const onPointerLeave = (e) => {
      // Handle edge case: pointer leaves canvas/window during drag
      if (draggedRef.current) {
        console.log("Pointer left canvas, releasing particle"); // Debug log
        draggedRef.current = null; // Release drag
        dragOffsetRef.current = { x: 0, y: 0 }; // Reset offset
      }
    };

    render.canvas.addEventListener("pointerdown", onPointerDown);
    render.canvas.addEventListener("pointermove", onPointerMove);
    render.canvas.addEventListener("pointerup", onPointerUp);
    render.canvas.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("pointerup", onPointerUp); // Global release

    // Cleanup function for pointer event listeners (called on component unmount)
    const cleanup = () => {
      render.canvas.removeEventListener("pointerdown", onPointerDown);
      render.canvas.removeEventListener("pointermove", onPointerMove);
      render.canvas.removeEventListener("pointerup", onPointerUp);
      render.canvas.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("pointerup", onPointerUp); // Global listener for release outside canvas
    };

    // Mouse wheel handler for rotating colliders
    const onMouseWheel = (e) => {
      // Prevent scrolling if game is in a death/lost state
      if (currentGameStateRef.current === "lost") {
        e.preventDefault();
        return;
      }

      e.preventDefault();
      const rect = render.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Find collider under mouse
      const collider = collidersRef.current.find((c) => {
        const dx = c.position.x - mouseX;
        const dy = c.position.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < 60; // Detection radius
      });

      if (collider && collider.isStatic) {
        // Rotate by 15 degrees for static colliders
        const rotation = e.deltaY > 0 ? Math.PI / 12 : -Math.PI / 12;
        Matter.Body.rotate(collider, rotation);
      }
    };
    render.canvas.addEventListener("wheel", onMouseWheel, { passive: false });

    // Collision handling
    const onCollisionStart = (event) => {
      for (const pair of event.pairs) {
        if (gameMode === "survival") {
          if (handleSurvivalCollision(pair)) {
            // Find and remove the particle from the ref array
            const particleBody = pair.bodyA.isParticle
              ? pair.bodyA
              : pair.bodyB;
            const idx = particlesRef.current.indexOf(particleBody);
            if (idx > -1) {
              particlesRef.current.splice(idx, 1);
              setParticleCount((c) => c - 1);
            }
            continue; // Skip other handlers if survival mode handled it
          }
        }
        handleSensorCollision(pair.bodyA, pair.bodyB);
        handleSensorCollision(pair.bodyB, pair.bodyA);
      }
    };

    const handleSensorCollision = (sensor, other) => {
      if (!sensor.isSensor || !other || !other.isParticle) return;

      // Goal zone collection
      if (sensor.isGoalZone && gameMode === "challenge") {
        Matter.World.remove(engineRef.current.world, other);
        const idx = particlesRef.current.indexOf(other);
        if (idx > -1) particlesRef.current.splice(idx, 1);
        setParticleCount((c) => Math.max(0, c - 1));
        setScore((s) => s + 10);
        setObjective((obj) => {
          if (!obj) return null;
          const newProgress = obj.progress + 1;
          if (newProgress >= obj.target) {
            setGameState("won");
          }
          return { ...obj, progress: newProgress };
        });
        return;
      }

      // Color zone collection
      if (
        sensor.isColorZone &&
        gameMode === "collection" &&
        other.collectionColor
      ) {
        if (sensor.zoneName === other.collectionColor) {
          // Correct sort - remove particle
          Matter.World.remove(engineRef.current.world, other);
          const idx = particlesRef.current.indexOf(other);
          if (idx > -1) particlesRef.current.splice(idx, 1);
          setParticleCount((c) => Math.max(0, c - 1));

          const now = performance.now();
          let currentCombo = 1;
          if (now - lastComboTimeRef.current < 2000) {
            setCombo((c) => {
              currentCombo = c + 1;
              return currentCombo;
            });
          } else {
            setCombo(1);
            currentCombo = 1;
          }
          lastComboTimeRef.current = now;

          setCollectedParticles((cp) => ({
            ...cp,
            [other.collectionColor]: cp[other.collectionColor] + 1,
          }));
          setScore((s) => s + 20 * currentCombo);
          setObjective((obj) => {
            if (!obj) return null;
            const newProgress = obj.progress + 1;
            if (newProgress >= obj.target) {
              setGameState("won");
            }
            return { ...obj, progress: newProgress };
          });
        } else {
          // Wrong sort - don't remove, just penalize
          setScore((s) => Math.max(0, s - 10));
          setCombo(0);
        }
        return;
      }

      // Destroyer (non-survival modes)
      if (sensor.destroyer && gameMode !== "survival") {
        Matter.World.remove(engineRef.current.world, other);
        const idx = particlesRef.current.indexOf(other);
        if (idx > -1) particlesRef.current.splice(idx, 1);
        setParticleCount((c) => Math.max(0, c - 1));

        // Award points in challenge mode for using destroyers
        if (gameMode === "challenge") {
          setScore((s) => s + 5);
        }
        return;
      }

      // Portal
      if (sensor.portal && portalsRef.current.length > 1) {
        const now = performance.now();
        const last = portalCooldownRef.current.get(other.id) || 0;
        if (now - last < 300) return; // increased cooldown to reduce re-entry loops

        const candidates = portalsRef.current.filter((p) => p !== sensor);
        if (!candidates.length) return;
        // Choose nearest portal to current sensor
        const sx = sensor.position?.x || 0;
        const sy = sensor.position?.y || 0;
        let target = candidates[0];
        let bestD2 = Infinity;
        candidates.forEach((p) => {
          const dx = (p.position?.x || 0) - sx;
          const dy = (p.position?.y || 0) - sy;
          const d2 = dx * dx + dy * dy;
          if (d2 < bestD2) {
            bestD2 = d2;
            target = p;
          }
        });

        // Offset exit beyond portal radius along velocity or portal axis
        const vx = other.velocity.x;
        const vy = other.velocity.y;
        let ox = vx;
        let oy = vy;
        const mag = Math.hypot(ox, oy);
        if (mag < 0.01) {
          // Use vector from source to target if velocity too small
          ox = (target.position?.x || 0) - sx;
          oy = (target.position?.y || 0) - sy;
        }
        const oMag = Math.hypot(ox, oy) || 1;
        const exitDist = 45; // push outside sensor
        const offset = { x: (ox / oMag) * exitDist, y: (oy / oMag) * exitDist };
        Matter.Body.setPosition(other, {
          x: (target.position?.x || 0) + offset.x,
          y: (target.position?.y || 0) + offset.y,
        });
        // Preserve speed but align direction with exit offset
        const speed = Math.hypot(vx, vy);
        if (speed > 0.01) {
          Matter.Body.setVelocity(other, {
            x: (ox / oMag) * speed,
            y: (oy / oMag) * speed,
          });
        }
        portalCooldownRef.current.set(other.id, now);
      }
    };

    Matter.Events.on(engine, "collisionStart", onCollisionStart);

    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);

    // Draw particle trails after render so they appear on top of particles
    Matter.Events.on(render, "afterRender", () => {
      const ctx = render.context;
      if (!ctx) return;
      ctx.save();
      ctx.globalAlpha = 0.8;
      particlesRef.current.forEach((p) => {
        if (!p.trail || p.trail.length < 2) return;
        ctx.beginPath();
        ctx.strokeStyle = (p.render && p.render.fillStyle) || "#ffffff";
        ctx.lineWidth = 2;
        for (let i = 0; i < p.trail.length - 1; i++) {
          const a = p.trail[i];
          const b = p.trail[i + 1];
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
        }
        ctx.stroke();
      });
      ctx.restore();
    });

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

      const wf = windForceRef.current;
      if (wf !== 0) {
        particlesRef.current.forEach((p) => {
          Matter.Body.applyForce(p, p.position, { x: wf * 0.000002, y: 0 });
        });
      }

      const ms = magnetStrengthRef.current;
      if (ms !== 0 && magnetsRef.current.length) {
        const count = particlesRef.current.length;
        let step = 1;
        if (count > 5000) step = 10;
        else if (count > 2000) step = 3;
        magnetsRef.current.forEach((mag) => {
          for (let i = 0; i < count; i += step) {
            const p = particlesRef.current[i];
            const dx = mag.position.x - p.position.x;
            const dy = mag.position.y - p.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0 && dist < 200) {
              const f = (ms * 0.0001) / (dist * dist);
              Matter.Body.applyForce(p, p.position, { x: dx * f, y: dy * f });
            }
          }
        });
      }

      // Survival mode: Apply continuous force toward core for enemy particles
      if (gameMode === "survival" && coreRef.current) {
        particlesRef.current.forEach((p) => {
          if (p.isEnemy) {
            const dx = coreRef.current.position.x - p.position.x;
            const dy = coreRef.current.position.y - p.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
              // Continuous force toward core
              const force = 0.00015;
              Matter.Body.applyForce(p, p.position, {
                x: (dx / dist) * force,
                y: (dy / dist) * force,
              });
            }
          }
        });
      }

      // Collection mode: Direct position setting for dragged particle
      // Now handled by pointer events above for better performance and control
      // Old magnet force code removed (was applying continuous force in physics loop)

      collidersRef.current.forEach((collider) => {
        if (collider.isSpinner) {
          const desired = 0.1;
          const ang = collider.angularVelocity || 0;
          // Apply only when below target; rely on air friction to damp
          if (Math.abs(ang) < desired * 0.9) {
            Matter.Body.setAngularVelocity(
              collider,
              (ang >= 0 ? 1 : -1) * desired
            );
          }
        }

        if (collider.patrol) {
          // Move collider along patrol path
          const patrol = collider.patrol;
          if (collider.isSpinner && collider.constraint) {
            // For spinners, move the constraint pivot point
            const newX =
              collider.constraint.pointA.x + patrol.speed * patrol.direction;

            if (newX >= patrol.endX) {
              patrol.direction = -1;
              collider.constraint.pointA.x = patrol.endX;
            } else if (newX <= patrol.startX) {
              patrol.direction = 1;
              collider.constraint.pointA.x = patrol.startX;
            } else {
              collider.constraint.pointA.x = newX;
            }
          } else {
            const newX = collider.position.x + patrol.speed * patrol.direction;

            if (newX >= patrol.endX) {
              patrol.direction = -1;
              Matter.Body.setPosition(collider, {
                x: patrol.endX,
                y: collider.position.y,
              });
            } else if (newX <= patrol.startX) {
              patrol.direction = 1;
              Matter.Body.setPosition(collider, {
                x: patrol.startX,
                y: collider.position.y,
              });
            } else {
              Matter.Body.setPosition(collider, {
                x: newX,
                y: collider.position.y,
              });
            }

            // Update velocity to maintain momentum
            Matter.Body.setVelocity(collider, {
              x: patrol.speed * patrol.direction,
              y: 0,
            });
          }
        }
      });

      // Update trails
      particlesRef.current.forEach((p) => {
        if (p.trail) {
          p.trail.push({ x: p.position.x, y: p.position.y });
          if (p.trail.length > 15) p.trail.shift();
        }
      });

      explosionsRef.current = explosionsRef.current.filter((ex) => {
        ex.life -= 0.02;
        if (ex.life <= 0) return false;

        // Track particles to trigger chain reactions
        const particlesToExplode = [];

        particlesRef.current.forEach((p) => {
          const dx = p.position.x - ex.x;
          const dy = p.position.y - ex.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0 && dist < ex.radius) {
            const f = (ex.power * 0.001) / (dist + 1);
            Matter.Body.applyForce(p, p.position, {
              x: (dx / dist) * f,
              y: (dy / dist) * f,
            });

            // Check if this explosive particle should trigger a chain reaction
            if (p.explosive && dist < ex.radius * 0.5 && !p.exploded) {
              particlesToExplode.push(p);
              p.exploded = true; // Mark to prevent re-triggering
            }
          }
        });

        // Trigger chain reactions for explosive particles
        if (particlesToExplode.length > 0) {
          if (gameMode === "reaction") {
            setChainReactions((c) => c + particlesToExplode.length);
          }

          // Schedule secondary explosions with slight delay for visual effect
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
            }, index * 50); // Stagger explosions for visual effect
          });
        }

        return true;
      });

      if (now - lastTime >= 1000) {
        const currentFps = Math.round((frameCount * 1000) / (now - lastTime));
        setFps(currentFps);
        const currentParticleCount = particlesRef.current.length;
        if (
          currentParticleCount > highScore.particles ||
          (currentParticleCount === highScore.particles &&
            currentFps > highScore.fps)
        ) {
          const newHigh = { particles: currentParticleCount, fps: currentFps };
          setHighScore(newHigh);
          localStorage.setItem("highScore", JSON.stringify(newHigh));
        }
        frameCount = 0;
        lastTime = now;
      }

      animationFrameId = requestAnimationFrame(physicsLoop);
    };

    physicsLoop();

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
      Matter.Render.lookAt(render, {
        min: { x: 0, y: 0 },
        max: { x: w, y: h },
      });
    };
    window.addEventListener("resize", resize);

    // Initialize game mode
    initializeGameMode(gameMode);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      if (renderRef.current && renderRef.current.canvas) {
        renderRef.current.canvas.removeEventListener("mousemove", onMouseMove);
        renderRef.current.canvas.removeEventListener("wheel", onMouseWheel);
        cleanup(); // Remove pointer event listeners
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
      goalZonesRef.current = [];
      coreRef.current = null;
      setParticleCount(0);
      setFps(0);
    };
  }, [currentPage, gameMode, currentLevel, initializeGameMode]);

  useEffect(() => {
    if (engineRef.current) engineRef.current.world.gravity.y = gravity;
  }, [gravity]);

  useEffect(() => {
    if (engineRef.current) engineRef.current.timing.timeScale = timeScale;
  }, [timeScale]);

  // Win/Loss handling with one-time guard per round
  useEffect(() => {
    if (gameState !== "won" && gameState !== "lost") return;
    const currentRound = roundIdRef.current;
    if (rewardGrantedRef.current === currentRound) return; // already awarded

    // Freeze physics on game over
    if (engineRef.current) {
      engineRef.current.timing.timeScale = 0;
    }

    const earnedCoins = gameState === "won" ? 5 : 1;
    setCoins((prev) => {
      const total = prev + earnedCoins;
      localStorage.setItem("totalCoins", total.toString());
      return total;
    });
    rewardGrantedRef.current = currentRound;
  }, [gameState]);

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
        Matter.Body.applyForce(p, p.position, {
          x: Math.cos(angle) * force,
          y: Math.sin(angle) * force,
        });
      }
    },
    [createParticle]
  );

  const createExplosion = useCallback(
    (x, y, power = explosionPower) => {
      if (gameMode === "reaction" && explosionsUsed >= maxExplosions) {
        return;
      }

      explosionsRef.current.push({ x, y, power, radius: power * 2, life: 1.0 });

      if (gameMode === "reaction") {
        setExplosionsUsed((e) => e + 1);
      }

      if (screenShake && sceneRef.current) {
        const intensity = Math.min(power / 50, 10);
        sceneRef.current.style.transform = `translate(${
          (Math.random() - 0.5) * intensity
        }px, ${(Math.random() - 0.5) * intensity}px)`;
        setTimeout(() => {
          if (sceneRef.current)
            sceneRef.current.style.transform = "translate(0, 0)";
        }, 100);
      }

      // Only remove non-explosive particles immediately
      // Explosive particles will be handled by the chain reaction system
      const toRemove = particlesRef.current.filter((p) => {
        const dx = p.position.x - x;
        const dy = p.position.y - y;
        const d = Math.sqrt(dx * dx + dy * dy);
        return d < power && !p.explosive;
      });

      toRemove.forEach((p) => {
        Matter.World.remove(engineRef.current.world, p);
        const idx = particlesRef.current.indexOf(p);
        if (idx > -1) particlesRef.current.splice(idx, 1);
        setParticleCount((c) => Math.max(0, c - 1));

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
      });
    },
    [explosionPower, screenShake, gameMode, explosionsUsed, maxExplosions]
  );

  const createCollider = useCallback(
    (x, y, type) => {
      console.log("Creating collider:", {
        x,
        y,
        type,
        engineExists: !!engineRef.current,
        collidersPlaced,
        colliderLimit,
      });
      if (!engineRef.current) return;
      if (gameMode !== "sandbox" && collidersPlaced >= colliderLimit) {
        return;
      }
      const world = engineRef.current.world;
      let collider;

      switch (type) {
        case "platform":
          collider = Matter.Bodies.rectangle(x, y, 120, 20, {
            isStatic: true,
            render: {
              fillStyle: "#8B4513",
              sprite: {
                texture:
                  "data:image/svg+xml;base64," +
                  btoa(
                    '<svg width="120" height="20" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="20" fill="#8B4513" rx="4"/><text x="60" y="14" font-family="Arial" font-size="12" fill="#FFF" text-anchor="middle">===</text></svg>'
                  ),
                xScale: 1,
                yScale: 1,
              },
            },
            friction: 0.8,
            restitution: 0.3,
            density: 0.001,
            frictionAir: 0.05,
          });
          break;
        case "bouncer":
          collider = Matter.Bodies.circle(x, y, 30, {
            isStatic: true,
            restitution: 1.8,
            render: {
              fillStyle: "#FF1493",
              sprite: {
                texture:
                  "data:image/svg+xml;base64," +
                  btoa(
                    '<svg width="60" height="60" xmlns="http://www.w3.org/2000/svg"><circle cx="30" cy="30" r="28" fill="#FF1493"/><text x="30" y="38" font-family="Arial" font-size="24" fill="#FFF" text-anchor="middle">UP</text></svg>'
                  ),
                xScale: 1,
                yScale: 1,
              },
            },
            density: 0.001,
            frictionAir: 0.05,
          });
          break;
        case "magnet":
          collider = Matter.Bodies.circle(x, y, 25, {
            isStatic: true,
            render: {
              fillStyle: "#4169E1",
              sprite: {
                texture:
                  "data:image/svg+xml;base64," +
                  btoa(
                    '<svg width="50" height="50" xmlns="http://www.w3.org/2000/svg"><circle cx="25" cy="25" r="23" fill="#4169E1"/><text x="25" y="33" font-family="Arial" font-size="20" fill="#FFF" text-anchor="middle">MAG</text></svg>'
                  ),
                xScale: 1,
                yScale: 1,
              },
            },
            isSensor: true,
            density: 0.001,
            frictionAir: 0.05,
          });
          magnetsRef.current.push({
            position: { x, y },
            strength: magnetStrengthRef.current,
          });
          break;
        case "destroyer":
          collider = Matter.Bodies.rectangle(x, y, 60, 60, {
            isStatic: true,
            render: {
              fillStyle: "#FF0000",
              sprite: {
                texture:
                  "data:image/svg+xml;base64," +
                  btoa(
                    '<svg width="60" height="60" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" fill="#FF0000" rx="8"/><text x="30" y="40" font-family="Arial" font-size="28" fill="#FFF" text-anchor="middle">DEL</text></svg>'
                  ),
                xScale: 1,
                yScale: 1,
              },
            },
            isSensor: true,
            destroyer: true,
            density: 0.001,
            frictionAir: 0.05,
          });
          break;
        case "portal":
          collider = Matter.Bodies.circle(x, y, 40, {
            isStatic: true,
            render: {
              fillStyle: "#9400D3",
              sprite: {
                texture:
                  "data:image/svg+xml;base64," +
                  btoa(
                    '<svg width="80" height="80" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="40" r="38" fill="#9400D3"/><text x="40" y="52" font-family="Arial" font-size="32" fill="#FFF" text-anchor="middle">PRT</text></svg>'
                  ),
                xScale: 1,
                yScale: 1,
              },
            },
            isSensor: true,
            portal: true,
            density: 0.001,
            frictionAir: 0.05,
          });
          portalsRef.current.push(collider);
          break;
        case "spinner":
          collider = Matter.Bodies.rectangle(x, y, 100, 20, {
            isStatic: false,
            render: {
              fillStyle: "#32CD32",
              sprite: {
                texture:
                  "data:image/svg+xml;base64," +
                  btoa(
                    '<svg width="100" height="20" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="20" fill="#32CD32" rx="4"/><text x="50" y="14" font-family="Arial" font-size="12" fill="#FFF" text-anchor="middle">SPN</text></svg>'
                  ),
                xScale: 1,
                yScale: 1,
              },
            },
            frictionAir: 0.02,
            friction: 0.02,
            restitution: 1,
            isSpinner: true,
            sleepThreshold: Infinity,
            density: 0.001,
          });
          const constraint = Matter.Constraint.create({
            pointA: { x, y },
            bodyB: collider,
            stiffness: 1,
            length: 0,
            render: {
              visible: false,
              strokeStyle: "transparent",
            },
          });
          Matter.World.add(world, constraint);
          constraintsRef.current.push(constraint);
          collider.constraint = constraint; // Reference for drag/patrol
          break;
        default:
          return;
      }

      if (collider) {
        console.log("Adding collider to world:", collider);
        Matter.World.add(world, collider);
        collidersRef.current.push(collider);
        // Store original static state for drag tool
        collider.originalStatic = collider.isStatic;
        console.log("Colliders in ref:", collidersRef.current.length);
        if (gameMode !== "sandbox") {
          setCollidersPlaced((c) => c + 1);
        }
      } else {
        console.log("No collider created for type:", type);
      }
    },
    [gameMode, collidersPlaced, colliderLimit]
  );

  const handleMouseDown = useCallback(
    (e) => {
      if (gameState !== "playing") return;
      setIsMouseDown(true);
      const rect = sceneRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      console.log("Mouse down:", { x, y, colliderMode, toolMode, gameMode });

      // Collection mode dragging now handled by pointer events above

      if (toolMode === "drag") { // Dragging for colliders (not particles)
        // Find collider under mouse for dragging
        draggedColliderRef.current = collidersRef.current.find((c) => {
          const dx = c.position.x - x;
          const dy = c.position.y - y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          return dist < 60; // Detection radius
        });
        if (draggedColliderRef.current) {
          // Temporarily make it static while dragging (unless it's a spinner)
          if (!draggedColliderRef.current.isSpinner) {
            draggedColliderRef.current.isStatic = true;
          }
        } else {
          // No collider to drag, fall back to default behavior
          if (colliderMode !== "none") createCollider(x, y, colliderMode);
          else if (gameMode === "sandbox") spawnParticles(x, y, 1);
        }
      } else if (toolMode === "patrol") {
        // Find collider under mouse to toggle patrol path
        const collider = collidersRef.current.find((c) => {
          const dx = c.position.x - x;
          const dy = c.position.y - y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          return dist < 60; // Detection radius
        });
        if (collider) {
          if (collider.patrol) {
            // Remove patrol
            delete collider.patrol;
          } else {
            // Set up patrol path: back and forth horizontally
            collider.patrol = {
              startX: collider.position.x - 100,
              endX: collider.position.x + 100,
              speed: 2,
              direction: 1,
            };
            // Keep original static state - setPosition works on static bodies
          }
        } else {
          // No collider to patrol, fall back to default behavior
          if (colliderMode !== "none") createCollider(x, y, colliderMode);
          else if (gameMode === "sandbox") spawnParticles(x, y, 1);
        }
      } else {
        switch (toolMode) {
          case "explosion":
            createExplosion(x, y);
            break;
          case "gun":
            fireParticleGun(x, y);
            break;
          default:
            if (colliderMode !== "none") createCollider(x, y, colliderMode);
            else if (gameMode === "sandbox") spawnParticles(x, y, 1);
        }
      }
    },
    [
      toolMode,
      colliderMode,
      createExplosion,
      fireParticleGun,
      createCollider,
      spawnParticles,
      gameState,
      gameMode,
    ]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!isMouseDown || gameState !== "playing") return;
      const rect = sceneRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Collection mode dragging now handled by pointer events above

      if (toolMode === "drag" && draggedColliderRef.current) { // Continue dragging collider if active
        // Drag the collider to the mouse position
        if (
          draggedColliderRef.current.isSpinner &&
          draggedColliderRef.current.constraint
        ) {
          // For spinners, move the constraint pivot point
          draggedColliderRef.current.constraint.pointA.x = x;
          draggedColliderRef.current.constraint.pointA.y = y;
        } else {
          Matter.Body.setPosition(draggedColliderRef.current, { x, y });
        }
      } else if (toolMode === "gun") {
        fireParticleGun(x, y);
      } else if (
        toolMode === "spray" ||
        (toolMode === "none" &&
          colliderMode === "none" &&
          gameMode === "sandbox")
      ) {
        spawnParticles(x, y, 1);
      }
    },
    [
      isMouseDown,
      toolMode,
      colliderMode,
      fireParticleGun,
      spawnParticles,
      gameState,
      gameMode,
      draggedParticle,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsMouseDown(false);
    if (draggedColliderRef.current) {
      // Restore original static state when done dragging (unless it's a spinner)
      if (!draggedColliderRef.current.isSpinner) {
        draggedColliderRef.current.isStatic =
          draggedColliderRef.current.originalStatic || false;
      }
      draggedColliderRef.current = null;
    }
    // Collection mode dragging now handled by pointer events above
  }, [draggedParticle]); // Note: draggedParticle is legacy state, may be removable

  const clearWorld = useCallback(() => {
    if (!engineRef.current) return;
    const world = engineRef.current.world;
    [
      ...particlesRef.current,
      ...collidersRef.current,
      ...constraintsRef.current,
    ].forEach((b) => Matter.World.remove(world, b));
    particlesRef.current = [];
    collidersRef.current = [];
    constraintsRef.current = [];
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

  const handlePause = () => {
    if (gameState === "paused") {
      setGameState("playing");
      if (engineRef.current) {
        engineRef.current.timing.timeScale = timeScale;
      }
    } else if (gameState === "playing") {
      setGameState("paused");
      if (engineRef.current) {
        engineRef.current.timing.timeScale = 0;
      }
    }
  };

  const handleRestart = () => {
    setCurrentPage("game");
    clearWorld();
    initializeGameMode(gameMode);
    if (engineRef.current) {
      engineRef.current.timing.timeScale = timeScale;
    }
  };

  const handleQuit = () => {
    setGameMode("sandbox");
    setCurrentPage("modes");
    clearWorld();
  };

  const handleLanguageChange = (language) => {
    setCurrentLanguage(language);
    localStorage.setItem("language", language);
    // Update document direction for RTL support
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  };



  const t = (key) => {
    return translations[currentLanguage][key] || key;
  };

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return (
          <div className="flex items-center justify-center min-h-screen pt-[100px] px-4 relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div
                className="bg-orb top-20 left-10 w-96 h-96 bg-purple-500/20"
                style={{ animationDelay: "0s" }}
              ></div>
              <div
                className="bg-orb bottom-20 right-10 w-80 h-80 bg-cyan-500/20"
                style={{ animationDelay: "2s" }}
              ></div>
              <div
                className="bg-orb top-1/2 left-1/2 w-72 h-72 bg-pink-500/20"
                style={{ animationDelay: "4s" }}
              ></div>
            </div>

            <div className="max-w-6xl mx-auto text-center space-y-12 relative z-10">
              <div className="space-y-6 animate-bounce-subtle">
                <h1 className="text-7xl md:text-9xl font-extrabold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-transparent bg-clip-text tracking-tight leading-none drop-shadow-2xl">
                  {t("title")}
                </h1>
                <h2 className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-orange-500 via-yellow-500 to-red-500 text-transparent bg-clip-text tracking-tight drop-shadow-2xl">
                  {t("subtitle")}
                </h2>
                <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                  {t("description")}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                <div className="card p-6 hover:scale-105 transition-all duration-300 group backdrop-blur-xl cursor-pointer">
                  <div className="text-6xl mb-3 group-hover:scale-110 transition-transform">
                    🎯
                  </div>
                  <div className="font-bold text-lg mb-1">
                    {t("challengeMode")}
                  </div>
                  <div className="text-sm text-slate-400">
                    {t("challengeDescription")}
                  </div>
                </div>
                <div className="card p-6 hover:scale-105 transition-all duration-300 group backdrop-blur-xl cursor-pointer">
                  <div className="text-6xl mb-3 group-hover:scale-110 transition-transform">
                    🌊
                  </div>
                  <div className="font-bold text-lg mb-1">
                    {t("survivalMode")}
                  </div>
                  <div className="text-sm text-slate-400">
                    {t("survivalDescription")}
                  </div>
                </div>
                <div className="card p-6 hover:scale-105 transition-all duration-300 group backdrop-blur-xl cursor-pointer">
                  <div className="text-6xl mb-3 group-hover:scale-110 transition-transform">
                    🎨
                  </div>
                  <div className="font-bold text-lg mb-1">
                    {t("collectionMode")}
                  </div>
                  <div className="text-sm text-slate-400">
                    {t("collectionDescription")}
                  </div>
                </div>
                <div className="card p-6 hover:scale-105 transition-all duration-300 group backdrop-blur-xl cursor-pointer">
                  <div className="text-6xl mb-3 group-hover:scale-110 transition-transform">
                    ⚡
                  </div>
                  <div className="font-bold text-lg mb-1">
                    {t("reactionMode")}
                  </div>
                  <div className="text-sm text-slate-400">
                    {t("reactionDescription")}
                  </div>
                </div>
              </div>

              <div className="space-y-4 mt-8">
                <button
                  onClick={() => setCurrentPage("modes")}
                  className="btn btn-primary px-16 py-5 text-2xl font-extrabold rounded-2xl shadow-2xl hover:scale-110 transform transition-all duration-300"
                >
                  {t("playNow")}
                </button>
                <p className="text-sm text-slate-400">{t("noInstall")}</p>
              </div>

              <div className="flex justify-center gap-12 text-center pt-8 border-t border-white/10">
                <div className="group cursor-default">
                  <div className="text-4xl font-bold text-purple-400 group-hover:scale-110 transition-transform">
                    5
                  </div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">
                    {t("gameModes")}
                  </div>
                </div>
                <div className="group cursor-default">
                  <div className="text-4xl font-bold text-cyan-400 group-hover:scale-110 transition-transform">
                    💰 {coins}
                  </div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">
                    {t("totalCoins")}
                  </div>
                </div>
                <div className="group cursor-default">
                  <div className="text-4xl font-bold text-pink-400 group-hover:scale-110 transition-transform">
                    20
                  </div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">
                    {t("challengeLevels")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "modes":
        return (
          <GameModeSelector
            onSelectMode={(mode) => {
              setGameMode(mode);
              setCurrentPage(mode === "sandbox" ? "sandbox" : "game");
            }}
            onBack={() => setCurrentPage("home")}
            t={t}
          />
        );

      case "sandbox":
      case "game":
        return (
          <>
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
            <div className="py-12 min-h-screen text-white px-4 flex flex-col">
              <h2 className="text-5xl font-extrabold text-center mb-8 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-transparent bg-clip-text tracking-tight drop-shadow-lg">
                {gameMode === "sandbox"
                  ? t("sandboxModeTitle")
                  : gameMode === "challenge"
                  ? `${t("challengeLevel")} ${currentLevel}`
                  : gameMode === "survival"
                  ? t("survivalModeTitle")
                  : gameMode === "collection"
                  ? t("collectionModeTitle")
                  : t("chainReactionMode")}
              </h2>

              <div className="max-w-7xl mx-auto space-y-6 flex-grow flex flex-col">
                {gameMode === "sandbox" && (
                  <>
                    <div className="toolbar justify-center gap-3 backdrop-blur-xl">
                      <select
                        value={mode}
                        onChange={(e) => setMode(e.target.value)}
                        className="px-4 py-2"
                      >
                        <option value="balls">{t("bouncingBalls")}</option>
                        <option value="sand">{t("fallingSand")}</option>
                        <option value="water">{t("waterDrops")}</option>
                        <option value="plasma">{t("plasmaEnergy")}</option>
                        <option value="metal">{t("metalChunks")}</option>
                        <option value="explosive">{t("explosives")}</option>
                      </select>
                      <button
                        onClick={() =>
                          spawnParticles(
                            (renderRef.current?.options?.width || 1000) / 2,
                            100,
                            1
                          )
                        }
                        className="btn-primary"
                      >
                        {t("addParticle")}
                      </button>
                      <button onClick={stressTest} className="btn-warning">
                        {t("stressTest")}
                      </button>
                      <button onClick={megaStressTest} className="btn-danger">
                        {t("megaTest")}
                      </button>
                      <button onClick={clearWorld} className="btn btn-ghost">
                        {t("clearAll")}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="control-group backdrop-blur-xl">
                        <label className="block text-xs uppercase tracking-wider text-purple-300 font-bold mb-2">
                          {t("gravity")}:{" "}
                          <span className="text-cyan-400">
                            {gravity.toFixed(1)}
                          </span>
                        </label>
                        <input
                          type="range"
                          min="-2"
                          max="3"
                          step="0.1"
                          value={gravity}
                          onChange={(e) =>
                            setGravity(parseFloat(e.target.value))
                          }
                          className="w-full"
                        />
                      </div>
                      <div className="control-group backdrop-blur-xl">
                        <label className="block text-xs uppercase tracking-wider text-purple-300 font-bold mb-2">
                          {t("size")}:{" "}
                          <span className="text-cyan-400">{particleSize}</span>
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="30"
                          value={particleSize}
                          onChange={(e) =>
                            setParticleSize(parseInt(e.target.value))
                          }
                          className="w-full"
                        />
                      </div>
                      <div className="control-group backdrop-blur-xl">
                        <label className="block text-xs uppercase tracking-wider text-purple-300 font-bold mb-2">
                          {t("wind")}:{" "}
                          <span className="text-cyan-400">{windForce}</span>
                        </label>
                        <input
                          type="range"
                          min="-50"
                          max="50"
                          value={windForce}
                          onChange={(e) =>
                            setWindForce(parseInt(e.target.value))
                          }
                          className="w-full"
                        />
                      </div>
                      <div className="control-group backdrop-blur-xl">
                        <label className="block text-xs uppercase tracking-wider text-purple-300 font-bold mb-2">
                          {t("magnet")}:{" "}
                          <span className="text-cyan-400">
                            {magnetStrength}
                          </span>
                        </label>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={magnetStrength}
                          onChange={(e) =>
                            setMagnetStrength(parseInt(e.target.value))
                          }
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="control-group backdrop-blur-xl">
                        <label className="block text-xs uppercase tracking-wider text-purple-300 font-bold mb-2">
                          {t("time")}:{" "}
                          <span className="text-cyan-400">
                            {timeScale.toFixed(1)}
                          </span>
                        </label>
                        <input
                          type="range"
                          min="0.1"
                          max="3"
                          step="0.1"
                          value={timeScale}
                          onChange={(e) =>
                            setTimeScale(parseFloat(e.target.value))
                          }
                          className="w-full"
                        />
                      </div>
                      <div className="control-group backdrop-blur-xl">
                        <label className="block text-xs uppercase tracking-wider text-purple-300 font-bold mb-2">
                          {t("explosion")}:{" "}
                          <span className="text-cyan-400">
                            {explosionPower}
                          </span>
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="200"
                          value={explosionPower}
                          onChange={(e) =>
                            setExplosionPower(parseInt(e.target.value))
                          }
                          className="w-full"
                        />
                      </div>
                      <div className="control-group backdrop-blur-xl">
                        <label className="block text-xs uppercase tracking-wider text-purple-300 font-bold mb-2">
                          {t("color")}
                        </label>
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="w-full h-8 rounded"
                        />
                      </div>
                      <div className="control-group backdrop-blur-xl flex items-center justify-center">
                        <button
                          onClick={() => setScreenShake(!screenShake)}
                          className={`btn ${
                            screenShake
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-slate-700 hover:bg-slate-600"
                          }`}
                        >
                          {t("screenShake")}
                        </button>
                      </div>
                    </div>

                    <div className="card p-5 backdrop-blur-xl">
                      <h3 className="text-sm font-bold mb-3 text-purple-300 uppercase tracking-wider flex items-center gap-2">
                        <span className="text-lg">🛠️</span> {t("tools")}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setToolMode("none")}
                          className={`btn ${
                            toolMode === "none"
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-slate-700 hover:bg-slate-600"
                          }`}
                        >
                          {t("normal")}
                        </button>
                        <button
                          onClick={() => setToolMode("spray")}
                          className={`btn ${
                            toolMode === "spray"
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-blue-700 hover:bg-blue-600"
                          }`}
                        >
                          {t("spray")}
                        </button>
                        <button
                          onClick={() => setToolMode("gun")}
                          className={`btn ${
                            toolMode === "gun"
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-yellow-700 hover:bg-yellow-600"
                          }`}
                        >
                          {t("particleGun")}
                        </button>
                        <button
                          onClick={() => setToolMode("explosion")}
                          className={`btn ${
                            toolMode === "explosion"
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-red-700 hover:bg-red-600"
                          }`}
                        >
                          {t("exploder")}
                        </button>
                        <button
                          onClick={() => setToolMode("drag")}
                          className={`btn ${
                            toolMode === "drag"
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-purple-700 hover:bg-purple-600"
                          }`}
                        >
                          Drag
                        </button>
                        <button
                          onClick={() => setToolMode("patrol")}
                          className={`btn ${
                            toolMode === "patrol"
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-orange-700 hover:bg-orange-600"
                          }`}
                        >
                          Patrol
                        </button>
                      </div>
                    </div>

                    <div className="card p-5 backdrop-blur-xl">
                      <h3 className="text-sm font-bold mb-3 text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                        <span className="text-lg">⚙️</span> {t("colliders")}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setColliderMode("none")}
                          className={`btn ${
                            colliderMode === "none"
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-slate-700 hover:bg-slate-600"
                          }`}
                        >
                          {t("none")}
                        </button>
                        <button
                          onClick={() => setColliderMode("platform")}
                          className={`btn ${
                            colliderMode === "platform"
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-amber-700 hover:bg-amber-600"
                          }`}
                        >
                          {t("platform")}
                        </button>
                        <button
                          onClick={() => setColliderMode("bouncer")}
                          className={`btn ${
                            colliderMode === "bouncer"
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-pink-700 hover:bg-pink-600"
                          }`}
                        >
                          {t("superBouncer")}
                        </button>
                        <button
                          onClick={() => setColliderMode("magnet")}
                          className={`btn ${
                            colliderMode === "magnet"
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-blue-700 hover:bg-blue-600"
                          }`}
                        >
                          {t("magnetTool")}
                        </button>
                        <button
                          onClick={() => setColliderMode("destroyer")}
                          className={`btn ${
                            colliderMode === "destroyer"
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-red-700 hover:bg-red-600"
                          }`}
                        >
                          {t("destroyer")}
                        </button>
                        <button
                          onClick={() => setColliderMode("portal")}
                          className={`btn ${
                            colliderMode === "portal"
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-purple-700 hover:bg-purple-600"
                          }`}
                        >
                          {t("portal")}
                        </button>
                        <button
                          onClick={() => setColliderMode("spinner")}
                          className={`btn ${
                            colliderMode === "spinner"
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-green-700 hover:bg-green-600"
                          }`}
                        >
                          {t("spinner")}
                        </button>
                      </div>
                    </div>

                    {showStats && (
                      <div className="card p-5 backdrop-blur-xl">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                          <div className="group cursor-default">
                            <div className="text-3xl font-extrabold bg-gradient-to-r from-red-400 to-red-600 text-transparent bg-clip-text group-hover:scale-110 transition-transform">
                              {fps}
                            </div>
                            <div className="text-xs uppercase tracking-wide text-slate-300">
                              {t("fps")}
                            </div>
                          </div>
                          <div className="group cursor-default">
                            <div className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text group-hover:scale-110 transition-transform">
                              {particleCount}
                            </div>
                            <div className="text-xs uppercase tracking-wide text-slate-300">
                              {t("particles")}
                            </div>
                          </div>
                          <div className="group cursor-default">
                            <div className="text-3xl font-extrabold bg-gradient-to-r from-green-400 to-green-600 text-transparent bg-clip-text group-hover:scale-110 transition-transform">
                              {highScore.particles}
                            </div>
                            <div className="text-xs uppercase tracking-wide text-slate-300">
                              {t("highScore")}
                            </div>
                          </div>
                          <div className="group cursor-default">
                            <div className="text-3xl font-extrabold bg-gradient-to-r from-purple-400 to-purple-600 text-transparent bg-clip-text group-hover:scale-110 transition-transform">
                              {collidersRef.current.length}
                            </div>
                            <div className="text-xs uppercase tracking-wide text-slate-300">
                              {t("collidersCount")}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {gameMode !== "sandbox" && (
                  <>
                    <div className="card p-5 text-center backdrop-blur-xl">
                      <p className="text-slate-300">
                        {gameMode === "challenge" &&
                          `${t(
                            "particleBudget"
                          )}: ${particlesSpawned}/${particleBudget}`}
                        {gameMode === "survival" && t("defendCore")}
                        {gameMode === "collection" &&
                          t("collectionInstruction")}
                        {gameMode === "reaction" &&
                          t("reactionInstruction")
                            .replace("{used}", explosionsUsed)
                            .replace("{max}", maxExplosions)}
                      </p>
                    </div>

                    <div className="card p-5 text-center backdrop-blur-xl">
                      <button
                        onClick={() => setParticleTrails(!particleTrails)}
                        className={`btn ${
                          particleTrails
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-slate-700 hover:bg-slate-600"
                        }`}
                      >
                        {particleTrails ? "Disable Trails" : "Enable Trails"}
                      </button>
                    </div>

                    {(gameMode === "survival" || gameMode === "challenge") && (
                      <div className="card p-5 backdrop-blur-xl">
                        <h3 className="text-sm font-bold mb-3 text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                          <span className="text-lg">⚙️</span>
                          {t("colliders")} ({collidersPlaced}/{colliderLimit})
                        </h3>
                        <p className="text-xs text-slate-400 mb-3">
                          💡 Use mouse wheel to rotate colliders
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setColliderMode("none")}
                            className={`btn ${
                              colliderMode === "none"
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-slate-700 hover:bg-slate-600"
                            }`}
                          >
                            {t("none")}
                          </button>
                          <button
                            onClick={() => setColliderMode("platform")}
                            className={`btn ${
                              colliderMode === "platform"
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-amber-700 hover:bg-amber-600"
                            }`}
                          >
                            {t("platform")}
                          </button>
                          <button
                            onClick={() => setColliderMode("bouncer")}
                            className={`btn ${
                              colliderMode === "bouncer"
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-pink-700 hover:bg-pink-600"
                            }`}
                          >
                            {t("superBouncer")}
                          </button>
                          <button
                            onClick={() => setColliderMode("destroyer")}
                            className={`btn ${
                              colliderMode === "destroyer"
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-red-700 hover:bg-red-600"
                            }`}
                          >
                            {t("destroyer")}
                          </button>
                          <button
                            onClick={() => setColliderMode("spinner")}
                            className={`btn ${
                              colliderMode === "spinner"
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-green-700 hover:bg-green-600"
                            }`}
                          >
                            {t("spinner")}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="card p-4 flex-grow flex items-center justify-center backdrop-blur-xl">
                  <div
                    ref={simContainerRef}
                    style={{
                      width: "100%",
                      maxWidth: "1400px",
                      margin: "auto",
                    }}
                  >
                    <div
                      ref={sceneRef}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      className={`sim-stage relative w-full overflow-hidden ${
                        gameMode === "collection"
                          ? draggedParticle
                            ? "cursor-grabbing"
                            : "cursor-grab"
                          : "cursor-crosshair"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        );

      case "leaderboard":
        return (
          <div className="py-12 min-h-screen text-white px-4">
            <h2 className="text-5xl font-extrabold text-center mb-12 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-transparent bg-clip-text tracking-tight">
              {t("leaderboard")}
            </h2>
            <div className="max-w-md mx-auto card p-8 text-center space-y-6 backdrop-blur-xl">
              <p className="text-3xl font-bold mb-6 text-purple-300">
                {t("sandboxHighScore")}
              </p>
              <div className="space-y-4">
                <div className="card p-4 backdrop-blur-md">
                  <p className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">
                    {highScore.particles}
                  </p>
                  <p className="text-sm text-slate-400 uppercase tracking-wide mt-2">
                    {t("particles")}
                  </p>
                </div>
                <div className="card p-4 backdrop-blur-md">
                  <p className="text-4xl font-extrabold bg-gradient-to-r from-red-400 to-red-600 text-transparent bg-clip-text">
                    {highScore.fps}
                  </p>
                  <p className="text-sm text-slate-400 uppercase tracking-wide mt-2">
                    {t("fps")}
                  </p>
                </div>
              </div>
              <div className="pt-6 border-t border-white/10">
                <p className="text-4xl font-bold text-green-400">💰 {coins}</p>
                <p className="text-sm text-slate-400">
                  {t("totalCoinsEarned")}
                </p>
              </div>
            </div>
          </div>
        );

      case "about":
        return (
          <div className="py-12 min-h-screen text-white px-4">
            <h2 className="text-5xl font-extrabold text-center mb-12 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-transparent bg-clip-text tracking-tight">
              {t("about")}
            </h2>
            <div className="max-w-2xl mx-auto card p-8 backdrop-blur-xl">
              <p className="text-xl mb-4 text-center">
                {t("title")} {t("subtitle")}
              </p>
              <p className="mb-4 text-center text-slate-300">
                {t("builtWith")}
              </p>
              <div className="text-left space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-purple-400 mb-2">
                    {t("gameModesSection")}
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    <li>
                      {t("sandboxMode")} - {t("sandboxDescription")}
                    </li>
                    <li>
                      {t("challengeMode")} - {t("challengeDescription")}
                    </li>
                    <li>
                      {t("survivalMode")} - {t("survivalDescription")}
                    </li>
                    <li>
                      {t("collectionMode")} - {t("collectionDescription")}
                    </li>
                    <li>
                      {t("reactionMode")} - {t("reactionDescription")}
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-cyan-400 mb-2">
                    {t("featuresSection")}
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    <li>{t("particleLimit")}</li>
                    <li>{t("particleTypes")}</li>
                    <li>{t("advancedTools")}</li>
                    <li>{t("interactiveColliders")}</li>
                    <li>{t("physicsForces")}</li>
                    <li>{t("coinSystem")}</li>
                    <li>{t("screenShakeEffects")}</li>
                    <li>{t("timeScaling")}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };
  return (
    <>
      <div className="min-h-screen flex flex-col">
        <Navbar
          setCurrentPage={setCurrentPage}
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
        />
        <div className="h-[100px]"></div>
        <main className="flex-1 flex flex-col">{renderPage()}</main>
      </div>
    </>
  );
};

export default App;
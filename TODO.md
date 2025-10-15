# PhysicsBox - Expanded Features Implementation TODO

## Phase 1: New Game Modes
- [ ] Fusion Mode
[ ] Fusion Mode
- [ ] Add system to detect overlapping particle types
- [ ] Define fusion recipes (e.g., sand + water → mud, plasma + metal → magnetized ore)
- [ ] Create fusionHandler() for combining particles
- [ ] Add energy cost or cooldown mechanic
- [ ] Add small explosion or glow effect during fusion

[ ] Chaos Mode
- [ ] Create chaosController() that randomizes physics parameters
- [ ] Randomize gravity, air friction, wind, timeScale, restitution, etc.
- [ ] Add survival timer or score based on duration
- [ ] Add “stabilize” button to reset physics to normal

[ ] Construction Mode
- [ ] Add new body types: hinges, springs, pulleys, motors
- [ ] Create “Connect” tool for linking objects
- [ ] Implement basic objectives (e.g., transport a ball to a goal)
- [ ] Add stress visualization (tension color indicators)
- [ ] Allow saving/loading contraption setups

[ ] Simulation Lab
- [ ] Add preset scenarios (bridge stress test, meteor impact, magnetic storm)
- [ ] Create menu for selecting simulations
- [ ] Add scoring or success conditions for each scenario

## ⚙️ Advanced Physics Features

[ ] Temperature System
- [ ] Add temperature property to particles
- [ ] Define behavior: melting, freezing, vaporizing
- [ ] Explosions and plasma increase local temperature
- [ ] Create visual heatmap overlay

[ ] Pressure & Fluid Simulation
- [ ] Calculate local particle density
- [ ] Apply outward force proportional to density
- [ ] Give liquids compression resistance
- [ ] Visualize pressure zones with optional debug overlay

[ ] Electric Charges
- [ ] Add charge property: positive, negative, neutral
- [ ] Apply Coulomb-like attraction/repulsion forces
- [ ] Add Tesla Coil collider that emits electric arcs
- [ ] Visual spark effects between charged particles

[ ] Chain Physics
- [ ] Implement spring or constraint links between particles
- [ ] Add rope/chain tool to connect multiple bodies
- [ ] Simulate snapping if tension exceeds threshold
- [ ] Optional: oscillation damping for smoother motion

## 🎮 Gameplay Systems

[ ] Achievements
- [ ] Add system for tracking player actions
- [ ] Define achievement conditions (e.g., spawn 10,000 particles, destroy 500)
- [ ] Add reward pop-ups or coin bonuses

[ ] Player Upgrades
- [ ] Add in-game shop or upgrade screen
- [ ] Create upgrade data (particle unlocks, tool boosts, visuals)
- [ ] Store purchases in localStorage
- [ ] Integrate with coin system

## 🎨 Visual & Immersion Features

[ ] Visual Filters
- [ ] Add toggleable filters (CRT, neon glow, dark mode, infrared)
- [ ] Implement via CSS filters or WebGL shaders

[ ] Replay System
- [ ] Record and save short simulation clips
- [ ] Add play/pause/rewind controls
- [ ] Allow exporting as GIF or video

[ ] Slow-Mo Camera
- [ ] Add slow-motion trigger (e.g., hold Shift key)
- [ ] Gradually adjust engine.timing.timeScale
- [ ] Add motion blur and intensified trails during slow motion

## 🧠 Future Considerations

[ ] Optimize physics updates with Web Workers
[ ] Add offscreen canvas for rendering large simulations
[ ] Improve collision performance for 50k+ particles
[ ] Add visual settings menu (particle detail, trail opacity, etc.)

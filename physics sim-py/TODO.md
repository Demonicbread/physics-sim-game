## Import Features from Root Project to Python Version

### Fix Object Container Alignment
- [ ] Make physics simulation responsive to canvas size instead of hardcoded 1200x700
- [ ] Update boundaries creation to use dynamic width/height
- [ ] Ensure canvas rendering matches physics coordinates

### Add Missing Particle Types
- [ ] Add 'explosive' particle type with orange color and explosive behavior

### Add Missing Colliders
- [ ] Add 'magnet' collider (blue circle, sensor, attracts particles)
- [ ] Add 'portal' collider (purple circle, sensor, teleports particles)
- [ ] Add 'spinner' collider (green rectangle, rotates and applies force)

### Add Missing Tools
- [ ] Implement 'spray' tool (rapid particle placement on mouse move)
- [ ] Implement 'gun' tool (fires particles with velocity)
- [ ] Implement 'explosion' tool (creates explosion at click position)

### Add Missing Controls
- [ ] Add magnet strength control (affects magnet collider attraction)
- [ ] Add explosion power control (affects explosion radius and force)
- [ ] Add screen shake toggle (shakes canvas on explosions)
- [ ] Add particle trails toggle (leaves trails behind particles)

### Backend Enhancements
- [ ] Add high score tracking (particles and FPS)
- [ ] Implement portal teleportation logic
- [ ] Add explosion effects and forces
- [ ] Add magnetic forces calculation

### Frontend Updates
- [ ] Update HTML to include new colliders, controls, and toggles
- [ ] Update JS to handle new tools and controls
- [ ] Update CSS for new UI elements
- [ ] Add screen shake animation
- [ ] Add particle trail rendering

### Testing
- [ ] Test all new particle types and behaviors
- [ ] Test all new colliders and interactions
- [ ] Test all new tools
- [ ] Test responsive canvas alignment
- [ ] Verify high score persistence

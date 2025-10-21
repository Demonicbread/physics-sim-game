# TODO: Fix Physics Sim Game Performance Issues

## 1. Move Rapidly Changing State to useRef
- [x] Convert particleCount, fps, score, coins, timeRemaining, particlesSpawned, collidersPlaced, waveCountdown, combo, collectedParticles, chainReactions, explosionsUsed to useRef
- [ ] Implement throttled UI updates (every 100ms) for stats like fps and particleCount
- [x] Keep useState for UI-critical values (currentPage, mode, gravity, etc.)

## 2. Fix Cleanup in useEffects
- [ ] Enhance physics initialization useEffect to remove all event listeners (mousemove, pointer events, wheel)
- [ ] Ensure complete Matter.js cleanup (render, runner, engine)
- [ ] Verify other useEffects have proper cleanup

## 3. Add Missing Dependencies
- [ ] Update createParticle useCallback dependency array
- [ ] Update main physics useEffect dependency array to include all referenced states/refs

## 4. Minor Cleanups
- [ ] Remove legacy draggedParticle state
- [ ] Move achievements/shop logic to custom useGameLogic hook
- [ ] Split large physics useEffect into smaller, focused effects if feasible

## Followup Steps
- [ ] Test performance improvements (FPS stability, reduced re-renders)
- [ ] Verify no memory leaks using browser DevTools
- [ ] Run game in different modes to ensure functionality preserved

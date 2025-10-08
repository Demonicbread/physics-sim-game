# Physics Sim Game - Project Instructions

## Project Overview
An extreme physics simulation game built with React, Vite, Matter.js, and Tailwind CSS. Features advanced particle systems, interactive colliders, and real-time physics forces.

## Tech Stack
- **Frontend**: React 19 + Vite
- **Physics Engine**: Matter.js (2D physics)
- **Styling**: Tailwind CSS 4 with custom component classes
- **Font**: Plus Jakarta Sans (loaded via Google Fonts)
- **Database**: Prisma + PostgreSQL (not yet integrated with game)

## Key Features
- **50,000 particle limit** (up from original 10k)
- **6 particle types**: Balls, Sand, Water, Plasma, Metal, Explosives
- **Advanced tools**: Particle Gun, Spray, Explosion system
- **Interactive colliders**: Platforms, Bouncers, Magnets, Destroyers, Portals (visual only), Spinners
- **Physics forces**: Wind, Magnetism, Gravity control, Time scaling
- **Performance**: Screen shake effects, FPS monitoring, high score tracking

## Project Structure
```
physics-sim-game/
├── src/
│   ├── components/
│   │   └── Navbar.jsx          # Navigation component
│   ├── App.jsx                  # Main application with physics engine
│   ├── main.jsx                 # React entry point
│   ├── index.css                # Global styles with Tailwind + custom components
│   └── styles.css               # Additional styles
├── public/                      # Static assets
├── prisma/
│   └── schema.prisma            # Database schema (User/Post models)
├── analyze-project.js           # Project analysis tool
├── dependency-graph.js          # Dependency visualization tool
├── performance-profiler.js      # Physics performance profiler
└── package.json
```

## Custom Tailwind Components (in index.css)
Use these classes for consistent styling:
- `.card` - Glass-morphism card with backdrop blur
- `.toolbar` - Horizontal control bar with flex layout
- `.control-group` - Individual control container
- `.btn` - Base button style
- `.btn-primary` - Blue action button
- `.btn-danger` - Red destructive button
- `.btn-warning` - Yellow warning button
- `.btn-ghost` - Transparent ghost button
- `.badge` - Small label/tag

## Development Commands
```bash
npm run dev      # Start dev server (usually http://localhost:5173)
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Important Notes

### Physics Engine Architecture
- Engine initialized only when on 'game' page
- Uses Matter.Runner for better performance
- Custom physics loop handles wind, magnetism, explosions
- Proper cleanup on page navigation to prevent memory leaks
- Enhanced physics settings: 2 constraint iterations, 6 position iterations, 4 velocity iterations

### State Management
All physics state managed via refs:
- `engineRef` - Matter.js engine instance
- `renderRef` - Matter.js renderer
- `runnerRef` - Matter.js runner
- `particlesRef` - Array of particle bodies
- `collidersRef` - Array of collider bodies
- `explosionsRef` - Active explosions with life timers
- `magnetsRef` - Magnet positions and strengths

### Known Issues
1. **Portals are visual only** - Need collision detection and teleportation logic
2. **Destroyer colliders** - Defined but not removing particles on contact
3. **Database not integrated** - Prisma schema exists but not connected to game

### Performance Considerations
- Particle limit set to 50,000 but performance degrades around 5,000+ particles
- Use object pooling for better performance at high particle counts
- Spatial partitioning could improve collision detection
- Consider Web Workers for physics calculations at extreme particle counts

## Styling Guidelines
- Use slate color palette for backgrounds (slate-950, slate-900, slate-800)
- Purple/cyan accents for highlights (purple-500, cyan-400)
- Glass-morphism effects with `bg-white/5` and `backdrop-blur-sm`
- Consistent border styling with `border-white/10`
- Use uppercase tracking-wide labels for controls
- Font weights: 400 (normal), 600 (semibold), 700 (bold), 800 (extrabold)

## Code Style Preferences
- **No emojis in code comments or console logs** (emojis in UI are fine)
- Use `useCallback` for event handlers and functions passed as props
- Prefer functional components with hooks
- Keep physics logic separate from UI rendering
- Use descriptive variable names for physics properties

## Future Enhancements
1. **Portal mechanics** - Implement teleportation between portal pairs
2. **Destroyer functionality** - Remove particles on collision
3. **Particle trails** - Visual effect system (state exists but not implemented)
4. **Sound system** - Physics-based audio feedback
5. **Database integration** - Online leaderboards with Prisma
6. **Particle pooling** - Reuse particle objects for better performance
7. **Save/Load scenes** - Export and import collider configurations
8. **More collider types** - Conveyor belts, one-way platforms, force fields
9. **Particle interactions** - Explosives that detonate on impact
10. **Visual effects** - Glow effects, particle trails, motion blur

## Testing Tools
Three analysis tools are included:
1. **analyze-project.js** - Comprehensive project overview, dependencies, code metrics
2. **dependency-graph.js** - Visual dependency mapping, circular dependency detection
3. **performance-profiler.js** - Real-time physics performance monitoring (not yet integrated)

Run with: `node analyze-project.js` or `node dependency-graph.js`

## Common Tasks

### Adding a New Particle Type
1. Add option to mode select in App.jsx
2. Add case in `createParticle` function with physics properties
3. Set appropriate density, friction, restitution, frictionAir values

### Adding a New Collider
1. Add button to collider section with unique mode name
2. Add case in `createCollider` function
3. Define body shape, physics properties, and render style
4. Add to `collidersRef.current` array

### Adding a New Tool
1. Add button to tools section with unique mode name
2. Add case in `handleMouseDown` for click behavior
3. Add case in `handleMouseMove` for drag behavior (if needed)
4. Implement tool logic (spawn particles, apply forces, etc.)

### Adjusting Physics
- Gravity: `world.gravity.y` (default: 1)
- Time scale: `engine.timing.timeScale` (default: 1, range: 0.1-3)
- Particle properties: density, friction, restitution, frictionAir
- Collision iterations: constraintIterations, positionIterations, velocityIterations

## Debugging Tips
- Check browser console for Matter.js warnings
- Use `showStats` state to display FPS and particle count
- Monitor performance with browser DevTools Performance tab
- Check for memory leaks when navigating between pages
- Verify cleanup function runs properly in useEffect

## Contact & Collaboration
This is a high school student project focused on learning physics simulation and React development. The codebase is designed to be manageable and educational while still being feature-rich and performant.

---

Last Updated: 2024
Version: 0.1.0

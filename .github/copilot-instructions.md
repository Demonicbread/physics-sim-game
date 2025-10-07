## Quick orientation

This repository is a small single-page React physics simulator. The primary source of truth is `src/App.jsx` which: creates a Matter.js `Engine`/`Render`, mounts it to a DOM node referenced by `sceneRef`, and manages simulation state (mode, gravity, particle size/color, particle list) via React state and refs.

Read these files first:
- `src/App.jsx` — main app, engine lifecycle, UI controls, particle creation logic (`addParticleAt`, `addParticle`, `clearWorld`, `stressTest`).
- `src/components/Navbar.jsx` — navigation component (added if missing).

Scaffolded files (created to make the repo runnable):
- `package.json` — Vite dev scripts (`dev`, `build`, `preview`) and minimal deps (`react`, `react-dom`, `matter-js`).
- `index.html`, `src/main.jsx` — Vite entry and React mount point.
- `src/components/Navbar.jsx` — minimal navigation component so `App.jsx` imports resolve.
- `src/styles.css` — minimal CSS to render without Tailwind.

High-level architecture notes
- Single-page React app + Matter.js physics engine. The engine is created once and stored in `engineRef` (useRef). Render created by `Matter.Render.create` attaches a canvas into `sceneRef`.
- Data flow: UI events -> React state / refs -> create Matter Bodies -> `Matter.World.add(world, body)` -> Matter engine update -> Matter render draws canvas -> requestAnimationFrame loop in `App.jsx` computes FPS and updates `fps` state.
- Persistent state: high score saved to `localStorage` under key `highScore` (read/write in `App.jsx`).

Important patterns & gotchas (explicit, code-backed)
- Engine & render lifecycle: engine creation happens outside render (engineRef.current = Matter.Engine.create()). The main `useEffect` in `App.jsx` creates the `Render`, `MouseConstraint`, test bodies and then returns a cleanup that calls `Matter.Render.stop(render)`, `Matter.World.clear(world)`, `Matter.Engine.clear(engine)` and removes the canvas. Follow that pattern when changing lifecycle logic.
- Use refs for mutable simulation data: `engineRef` and `particlesRef` are used to avoid excessive re-renders. Prefer updating/referring to `particlesRef.current` for performance-sensitive loops instead of relying on React state.
- Particle cap: the code checks `particleCount >= 1000` in `addParticle*` helpers. That limit is enforced in JS logic — keep it in mind when adding tests or stress scenarios.
- UI-to-physics bindings: gravity is applied by writing `engineRef.current.world.gravity.y = gravity` inside a `useEffect` that listens on `gravity`. Follow the same pattern when changing other engine/world global parameters.
- FPS loop: FPS is computed with a `requestAnimationFrame` loop (local to the render `useEffect`). When changing FPS logic ensure the returned cleanup cancels the RAF and stops the render to avoid dangling animation loops.

Concrete examples (copy/paste-able guidance)
- Add a new particle type: edit `addParticleAt` in `src/App.jsx`. Add a new `case 'plasma':` that creates a Body (e.g. circle) and pushes it to `particlesRef.current`, then add a `<option value="plasma">Plasma</option>` in the UI select.
- Change default canvas size: update the `options.width/height` passed to `Matter.Render.create` and also update the inline style on the scene container (`style={{ width: '800px', height: '600px' }}`) so the DOM area matches the renderer.
- Persist additional settings: reuse `localStorage` (key `highScore`) pattern. Example: `localStorage.setItem('myKey', JSON.stringify(value))` and read it in a `useEffect` on mount.

Debugging & developer workflow hints

- This repo now contains a minimal `package.json` with Vite dev scripts. From the repo root use these PowerShell commands:

```powershell
# install deps
npm install

# start dev server (Vite)
npm run dev

# build for production
npm run build

# preview build output
npm run preview
```

- When you see rendering or lifecycle bugs, check for two common mistakes: (1) forgetting to stop the renderer / cancel RAF in cleanup, (2) mutating state during render loops (use refs instead). Search `Matter.Render.stop`, `cancelAnimationFrame`, and `engineRef` usage to find lifecycle anchors.

Repository conventions & style clues
- Tailwind classes are used in UI markup inside `App.jsx`; keep CSS changes consistent with utility-first approach.
- Component organization: small UI controls live in `App.jsx` for now; larger features should be added under `src/components/` as separate files.

Integration points & external deps to note
- Matter.js (physics) — imported as `import Matter from 'matter-js'` in `src/App.jsx`.
- React (hooks) — app relies on `useRef` + `useEffect` patterns; avoid converting engine lifecycle to class components without porting logic carefully.
- The About screen mentions Three.js but the current `src/App.jsx` does not import Three.js. If adding 3D features, confirm whether Three.js is present in `package.json`.

Known local anomaly
- `src/App.jsx` contains a stray character near the first `useEffect` (an extra `+` in the file) that will cause a syntax error. Run a build/linter after edits and fix any accidental characters before committing.

If you need more detail
- I only found `src/App.jsx` in the workspace snapshot. If there are other source files (components, package.json, build config), provide them or open the repo root so I can update these instructions to reference exact scripts and additional components.

Next steps for an AI agent
- Start by reading `src/App.jsx` top-to-bottom, then open `src/components/Navbar` if present. Run `npm install` and the dev script listed in `package.json`. Run the app and observe console output for the syntax error noted above. Ask for missing files if any expected components aren't present.

# Game Modes Implementation Guide

## What's Been Added

I've created the foundation for 5 complete game modes:

### 1. **Sandbox Mode** (existing - enhanced)
- Free play with unlimited resources
- All tools and colliders available
- No objectives or time limits

### 2. **Challenge Mode** 🎯
- 20 progressive levels with specific objectives
- Limited particle budgets and time limits
- Star rating system (1-3 stars based on performance)
- Objectives include:
  - Collect X particles in goal zones
  - Keep particles alive for duration
  - Use specific colliders strategically
  - Complete complex multi-objective challenges

### 3. **Survival Mode** 🌊
- Defend a core from endless waves of particles
- 3 lives system
- Increasing difficulty with each wave
- Score multipliers for combos
- Wave-based progression

### 4. **Collection Mode** 🎯
- Sort colored particles into matching zones
- Time pressure with increasing spawn rates
- Combo bonuses for consecutive correct sorts
- Penalties for wrong sorting
- 4 colors: red, blue, green, yellow

### 5. **Chain Reaction Mode** ⚡
- Create explosive chain reactions
- Limited explosions per level
- Score based on chain length and efficiency
- Progressive difficulty across 5 levels
- Bonus for destroying particles efficiently

## Files Created

1. **src/components/GameModeSelector.jsx**
   - Beautiful mode selection screen
   - Shows all 5 game modes with icons and descriptions

2. **src/components/GameHUD.jsx**
   - Dynamic HUD that adapts to each game mode
   - Shows score, lives, time, objectives, combos
   - Game over/win screens
   - Pause menu

3. **src/utils/gameModes.js**
   - All level definitions for Challenge mode (20 levels)
   - Wave configurations for Survival mode
   - Scoring algorithms for each mode
   - Star rating calculations

## How to Complete the Integration

The App.jsx file is too large to modify in one go. Here's what needs to be added:

### State Variables to Add (after line 18):
```javascript
// Game mode state
const [gameMode, setGameMode] = useState('sandbox');
const [currentLevel, setCurrentLevel] = useState(1);
const [score, setScore] = useState(0);
const [coins, setCoins] = useState(0);
const [lives, setLives] = useState(3);
const [timeRemaining, setTimeRemaining] = useState(60);
const [objective, setObjective] = useState(null);
const [gameState, setGameState] = useState('playing');
const [wave, setWave] = useState(1);
const [combo, setCombo] = useState(0);
const [targetZones, setTargetZones] = useState([]);
const [collectedParticles, setCollectedParticles] = useState({ red: 0, blue: 0, green: 0, yellow: 0 });
const [chainReactions, setChainReactions] = useState(0);
const [explosionsUsed, setExplosionsUsed] = useState(0);
const [maxExplosions, setMaxExplosions] = useState(5);
```

### Imports to Add (at top):
```javascript
import GameModeSelector from './components/GameModeSelector';
import GameHUD from './components/GameHUD';
import { CHALLENGE_LEVELS, SURVIVAL_WAVES, calculateScore, calculateCoins } from './utils/gameModes';
```

### New Page Cases to Add in renderPage():
```javascript
case 'modes':
  return (
    <GameModeSelector 
      onSelectMode={(mode) => {
        setGameMode(mode);
        setCurrentPage('game');
      }}
      onBack={() => setCurrentPage('home')}
    />
  );
```

### Game Logic to Add:

1. **Timer System** (for Challenge/Collection modes)
2. **Wave Spawner** (for Survival mode)
3. **Goal Zones** (collision detection for collecting particles)
4. **Color Sorting Logic** (for Collection mode)
5. **Chain Reaction Counter** (for Reaction mode)
6. **Score Calculation** (after completing objectives)
7. **Coin/Progression System** (localStorage for unlocks)

## Quick Start Option

Would you like me to:

**Option A**: Create a completely new App.jsx file with everything integrated (will replace current file)

**Option B**: Create separate game mode components that you can integrate gradually

**Option C**: Provide step-by-step instructions to manually add each piece

Let me know which approach you prefer and I'll proceed!

## Features Each Mode Needs

### Challenge Mode
- [ ] Level loader from CHALLENGE_LEVELS
- [ ] Goal zone rendering and collision
- [ ] Particle budget counter
- [ ] Timer countdown
- [ ] Win condition checker
- [ ] Star rating calculation
- [ ] Level progression

### Survival Mode
- [ ] Core/base to defend
- [ ] Wave spawner with intervals
- [ ] Lives system
- [ ] Particle AI (move toward core)
- [ ] Wave progression
- [ ] Combo multiplier

### Collection Mode
- [ ] 4 colored zones (corners)
- [ ] Random colored particle spawner
- [ ] Color matching collision detection
- [ ] Combo counter
- [ ] Wrong sort penalty
- [ ] Timer system

### Reaction Mode
- [ ] Pre-placed particle grid
- [ ] Explosion counter
- [ ] Chain reaction detector
- [ ] Efficiency calculator
- [ ] Level completion checker

All the UI components and data structures are ready - just need the game logic integrated!

---

## Addendum: Player Specification and Detailed TODOs (Do Not Remove Existing Sections)

This addendum augments the guide with player-facing behavior, strict TODOs per mode, acceptance criteria, shared foundations, implementation order, and QA scenarios. Follow this section to the letter when implementing.

### Navigation and Player Controls
- Flow: Home -> Play -> Mode Select -> In-Game
- HUD: Pause, Restart, Quit; Win/Lose overlay shows Score and Coins
- Mouse actions in sim area (subject to mode restrictions):
  - Normal/Spray/Gun/Exploder tools spawn or act on click/drag
  - Collider placement (Platform/Bouncer/Magnet/Destroyer/Portal/Spinner) on click
- Sliders: Gravity, Time scale, Wind, Magnet (enabled per mode)
- Input gating: Disallowed actions are visually disabled and are no-ops

### Shared Foundations (apply to all modes)
- Flags and router
  - Use standard flags: isParticle, isEnemy, isGoalZone, isColorZone(+zoneName), isCore, isDestroyer, isPortal
  - Single onCollisionStart handler routes by flags
  - Acceptance: Each path (goal/color/core/destroyer/portal) triggers exactly once per contact with intended state updates
- Timers and pause
  - Single per-second ticker for mode timers; pausing sets engine.timing.timeScale=0 and halts timers
  - Acceptance: Pause freezes physics/timers within 100ms; resume restores
- Cleanup correctness
  - On mode/page change, clear all intervals/listeners and reset arrays; remove sensors
  - Acceptance: No duplicate spawners/listeners after switching modes repeatedly
- Persistence
  - Keys: totalCoins, challengeStars[level], bestScores[mode], unlockedLevel
  - Read on boot, write on completion; only overwrite on improvement
- Tool and spawn rules
  - Budgeted spawns enforced in createParticle (non-enemy only)
  - Mode restrictions enforced both in UI and handlers
- Portals and destroyers
  - Portals require >=2, preserve velocity, per-particle cooldown
  - Destroyers remove particles; award survival score for enemies

### Mode Specifications (behavior + TODOs + acceptance)

1) Sandbox
- Goal: Free play
- Allowed: All tools/colliders/sliders, unlimited spawns
- HUD: Stats only
- TODO: Ensure sandbox cancels all other mode timers/spawners on entry
- Acceptance: Switching to sandbox stops all mode timers and hides mode HUD

2) Challenge
- Goal: Complete objective before timer; obey particleBudget and tool limits
- HUD: Objective text/progress, timer, budget counter
- Allowed: Spawning (budgeted), tools/colliders/sliders restricted per-level
- Win/Lose: Win at target reached before 0; lose at 0 before target
- Scoring: Objective metrics + time bonus -> stars -> coins; persist stars/unlock next level
- TODO:
  - Extend level schema with objectiveType and params:
    - collectInZone { target, timeLimit, zonePlacement }
    - survivalTime { particleMinAlive, timeLimit }
    - destroyWithDestroyer { target, timeLimit }
    - sendThroughPortals { target, timeLimit, requiredPortals }
    - bouncerScore { target, timeLimit }
  - Goal zone sensor per placement; enforce particleBudget; countdown timer
  - Compute score/stars/coins; persist challengeStars[level], unlockedLevel
- Acceptance: Budget blocks extra spawns; progress only from intended interactions; timer accurate; persistence updates only on improvement

3) Survival
- Goal: Defend cyan core from enemy waves
- HUD: Lives/hearts, Wave, Score, combo
- Allowed: Colliders; spawns off; sliders ok
- Win/Lose: Lose when lives==0; waves escalate indefinitely
- Scoring: Points per enemy destroyed; combo for kills within 2s
- TODO:
  - Core isCore with HP and hit feedback; enemy spawner off-screen; AI force towards core with per-wave speed
  - Wave manager using SURVIVAL_WAVES; inter-wave pauses
  - Combo timing logic
- Acceptance: Exactly one life lost per enemy impact; waves/cadence per config; combo increments only inside 2s window

4) Collection
- Goal: Sort particles into matching colored corner zones
- HUD: Timer, per-color counters, combo, score
- Allowed: Magnets/Platforms/Bouncers; Destroyers disabled; Portals optional; auto top-center spawns; sliders ok
- Win/Lose: Win at target before 0; lose at 0 otherwise
- Scoring: Correct +20*combo; wrong -10 and reset combo (optional -3s time)
- TODO:
  - Spawner: every 2s, colored particle (red/blue/green/yellow); increase rate over time
  - Zones: four corner sensors; highlight on correct overlap
  - Combo: correct within 2s chains; reset on miss or timeout
  - Timer management; progress and penalties
- Acceptance: Correct updates color counter/progress; wrong applies single penalty and resets combo; timer accurate; win/loss precise

5) Chain Reaction
- Goal: Reach target destroyed with limited manual explosions
- HUD: Explosions used/max, chain count, objective progress
- Allowed: Only explosions; no spawns/colliders; time scale slider optional
- Win/Lose: Win at target; lose when out of explosions without target
- Scoring: Chain length and efficiency
- TODO:
  - Pre-spawn grid with jitter; mark >=60% explosive
  - Click explosion consumes from cap; block beyond max
  - Chain logic: explosive particles in inner radius trigger delayed secondaries with per-id cooldowns
  - Progress counting and win/lose
- Acceptance: Chains propagate with bounded fan-out; HUD cap enforcement visible; win/loss trigger exactly on conditions

### Data, Timers, and Collision Routing
- Persistence: totalCoins, challengeStars[level], bestScores[mode], unlockedLevel
- Timer service: single per-second interval; bound to gameState/currentPage; paused physics halts timer
- Collision router priority: isCore -> isDestroyer -> isGoalZone -> isColorZone -> isPortal

### Implementation Order (must follow)
1) Shared foundations: flags/router/pause/timers/input gating/cleanup/persistence
2) Collection: spawner/zones/scoring/combo/penalties/timer/win-loss/HUD
3) Challenge: new level schema; collectInZone + survivalTime; budget; scoring/stars/persist
4) Survival: core/lives; enemy spawner+AI; waves; combo; scoring
5) Chain Reaction: explosion cap; chain propagation; progress; win/loss
6) Tool restrictions per mode; HUD polish; disabled-state wiring
7) QA and performance cleanup

### QA Acceptance Scenarios
- Mode switching: repeat 3x across all modes, no duplicate timers/spawns/listeners
- Pause/resume: pause for ~3s; resume; timers reflect pause; physics frozen
- Budget/gating: challenge budget exhaustion blocks spawns; HUD shows exhausted
- Sorting: 5 correct within 2s windows -> combo x5; wrong sort -> -10 and combo reset
- Survival: one enemy reaches core -> exactly one life lost; lose at 0
- Chain cap: clicks beyond maxExplosions ignored; HUD shows cap; win triggers when target reached
- Persistence: challenge replays only upgrade stored stars; coins persist across reloads

### Player How-To (quick start per mode)
- Sandbox: spawn, add bouncers/platforms, adjust gravity/wind, try explosions
- Challenge: read objective, place allowed colliders, use budget wisely, watch progress/time
- Survival: build funnels to destroyers, bend paths with magnets, adjust wind, protect core
- Collection: magnets near corners, use platforms/bouncers to split streams, adjust wind for combos
- Chain Reaction: detonate dense clusters first, time next detonations to catch remaining clusters

---

This addendum preserves the original guide and specifies exactly how to implement and play each mode, with acceptance criteria and a strict execution order.
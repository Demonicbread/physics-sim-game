# TODO: Navbar and UI Modifications

## Tasks
- [x] Edit Navbar.jsx: Remove home button and make logo clickable to go to home
- [x] Edit index.css: Change nav-link buttons to dark background
- [ ] Edit App.jsx: Add dark styling to balltype select in sandbox mode
- [ ] Edit App.jsx: Replace "none" button in sandbox mode collider section with spawner button
- [ ] Test changes: Run app and verify functionality

## New Task: Leaderboard with Username Entry
- [ ] Add leaderboard entries state in App.jsx: load from localStorage on mount, save on changes
- [ ] Add username popup modal that appears after game over (won/lost)
- [ ] On popup submit: create entry with current score, highScore.particles, highScore.fps, coins; append to entries; save to localStorage
- [ ] Update leaderboard page to display sorted list of entries (by score descending) instead of static highScore
- [ ] Create subacc folder and empty LEADERBOARD.text file (for simulation, but actual storage via localStorage)
- [ ] Test: Play a game, end it, enter username, check leaderboard

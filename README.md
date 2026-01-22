# ProjectOil - Strategic Board Games Collection

A collection of innovative tic-tac-toe variants with strategic depth, territorial gameplay, and checkers-inspired mechanics.

## 🎮 Games

### 1. **Tic-Tac-Toe 2: Infiltration v1.1** (LATEST!)
Strategic board game with flexible movement and territorial conquest.

**v1.1 Changes:**
- Movement: Any adjacent square (8 directions: N, S, E, W, NE, NW, SE, SW)
- Captures: Jump 2 squares in any straight line over enemy
- Piece count: 10 pieces per player (up from 8)
- Removed kings system (omnidirectional movement by default)
- Multi-jump: Continue capturing in the same turn (optional)

**Two-Phase Gameplay:**
- **Phase 1 (Deployment)**: Players alternate placing 10 pieces in their home territory
- **Phase 2 (Movement)**: Move to adjacent squares or capture by jumping over enemies

**Win Condition:** Create 4-in-a-row (H/V/D) entirely in your opponent's territory

**Key Features:**
- Flexible 8-directional movement (orthogonal + diagonal)
- Capture mechanics: Jump over adjacent enemies, return captured pieces to owner's inventory
- Multi-jump captures (optional)
- Configurable rules: Toggle piece count, captures, multi-jump, forced capture, pie rule

[Play Infiltration v1.1](infiltration.html) | [View Tests](infiltration-test.html)

---

### 2. **Checkerboard Tic-Tac-Toe (vNext with FIFO Caps)**
A strategic twist on classic tic-tac-toe with territorial gameplay, total piece limits, and invasion penalties on an 8×8 checkered board.

## 🎮 Game Rules (vNext)

### Objective
Create a 4-in-a-row (horizontal, vertical, or diagonal) **entirely in your opponent's side** of the board.

### Board Layout
- **8×8 checkered grid** (alternating dark and light squares)
- **Two halves** divided at the middle:
  - **Top half (rows 1-4)**: O's home territory / X's target zone
  - **Bottom half (rows 5-8)**: X's home territory / O's target zone

### Win Conditions
- Get **exactly 4 pieces in a row** (horizontal, vertical, or diagonal)
- **Critical rule**: All 4 pieces must be entirely within your **opponent's territory**
  - **Player X** must win in the top half (rows 1-4)
  - **Player O** must win in the bottom half (rows 5-8)
- A 4-in-a-row that crosses the boundary does **not** count as a win
- A 4-in-a-row in your own territory does **not** count as a win

### New Rules: FIFO-Based Caps (vNext)

#### A) Total On-Board Cap (Default: 15)
Each player may have at most **TOTAL_CAP = 15** pieces on the board at any time.

- **Trigger**: If placing a piece would cause you to exceed 15 total pieces
- **Automatic removal**: Your **OLDEST piece on your HOME half** is automatically removed (FIFO)
- **Fallback**: If you have NO pieces on your home half, your **oldest piece anywhere** is removed

#### B) Opponent-Half Invasion Cap + Penalty (Default: 8)
Each player may have at most **INVASION_CAP = 8** pieces on the opponent's half at any time.

- **Trigger**: If placing a piece **on opponent's half** causes you to exceed 8 invasion pieces
- **Automatic penalty**: Your **OLDEST piece on your HOME half** is automatically removed (FIFO)
- **Fallback**: If you have NO pieces on your home half, your **oldest piece anywhere** is removed
- **Important**: The penalty removes from your HOME half, not opponent half (strategic consequence)

#### Resolution Order (Critical!)
When you place a piece, the following happens **in this exact order**:

1. **Place** your piece on the board
2. **Invasion Penalty** (if you exceeded invasion cap on opponent half)
3. **Total Cap** (if you exceeded total cap anywhere)
4. **Win Check** (4-in-a-row validation)
5. **Turn Switch** (if no win)

**Why this order matters**: You cannot "momentarily" exceed caps to claim a win. Caps are enforced BEFORE win detection.

### Gameplay
- Players alternate turns placing their piece (X or O) on any empty square
- Automatic removals happen immediately after placement (no player choice)
- UI shows which pieces were removed and why (Invasion Penalty vs Total Cap)
- After all removals and win check, turn switches to other player
- Game ends when a player achieves valid 4-in-a-row or board is full (draw)

### Example Scenarios

**Scenario 1: Total Cap Exceeded**
- You have 15 pieces on board (10 home, 5 opponent)
- You place 16th piece on home half
- **Result**: Your oldest home piece (1st placed) is automatically removed
- Net effect: Still 15 total (9 home, 5 opponent + new piece)

**Scenario 2: Invasion Penalty**
- You have 12 pieces (4 home, 8 opponent) - at invasion cap
- You place 9th piece on opponent half
- **Result**: Your oldest HOME piece is automatically removed as penalty
- Net effect: 11 total (3 home, 8 opponent + new piece)

**Scenario 3: Both Caps Exceeded**
- You have 15 pieces (2 home, 13 opponent) - ridiculous invasion!
- You place 16th piece on opponent half
- **Resolution**:
  1. Place piece → 16 total, 14 invasion
  2. Invasion penalty → Remove oldest home → 15 total, 14 invasion
  3. Total cap (if still exceeded) → Remove oldest home (or fallback) → 14 total, 14 invasion
- Note: Invasion penalty triggers first, then total cap

**Scenario 4: Win After Removal**
- You have 3 pieces on opponent half in positions (0, 1, 2) - 3-in-a-row
- You place 4th piece at position 3 → 4-in-a-row complete!
- But this exceeds invasion cap, so oldest home piece removed first
- **Result**: Win is still detected after removal (4-in-a-row intact)

## 🚀 How to Play

### Web Version (Recommended)
All games are completely self-contained - just open the HTML files in any modern web browser!

**Play Games:**
- `index.html` - Landing page with all games
- `infiltration.html` - Tic-Tac-Toe 2: Infiltration (advanced)
- `checkerboard-tictactoe.html` - Checkerboard variant (strategic)
- `tictactoe.html` - Classic 3×3 (with AI)

**Run Tests:**
- `infiltration-test.html` - Infiltration game engine tests
- `test.html` - Checkerboard game engine tests

**No installation required** - No npm, no build tools, no dependencies!

### GitHub Pages (Mobile-Friendly)
Visit: `https://Feso3.github.io/ProjectOil/`

Play all games directly in your browser on desktop or mobile!

## 📁 Project Structure

```
ProjectOil/
├── index.html                     # Landing page (game selector)
│
├── infiltration.html              # Infiltration game (NEW - advanced)
├── infiltration-engine.js         # Infiltration game logic
├── infiltration-test.html         # Infiltration test suite
│
├── checkerboard-tictactoe.html    # Checkerboard variant (strategic)
├── game-engine.js                 # Checkerboard game logic
├── test.html                      # Checkerboard test suite
│
├── tictactoe.html                 # Classic 3×3 (with AI)
├── main.py                        # Python CLI version
└── README.md                      # This file
```

## 🏗️ Architecture

The project follows a clean separation of concerns:

### Game Engine (`game-engine.js`)
- **Pure logic** with no DOM/UI dependencies
- Deterministic and fully testable
- Key methods:
  - `applyMove(index)`: Apply move with automatic FIFO cap enforcement
  - `checkWin(player)`: Validate 4-in-a-row with territory constraint
  - `isInOpponentHalf(index, player)`: Check if position is in opponent territory
  - `isInHomeHalf(index, player)`: Check if position is in home territory
  - `countTotalPieces(player)`: Count total pieces on board
  - `countPiecesOnOpponentHalf(player)`: Count pieces in opponent territory
  - `countPiecesOnHomeHalf(player)`: Count pieces in home territory
  - `findOldestPiece(player, preferHome)`: Find oldest piece for FIFO removal
  - `removeOldestFromHome(player, reason)`: Automatic FIFO removal
  - `getValidMoves()`: Get all available positions
  - `reset()`: Start a new game
  - `getState()`/`loadState()`: Save/restore game state

### UI Layer (`checkerboard-tictactoe.html`)
- Renders the 8×8 checkered board
- Handles user input and interactions
- Displays game state, turn indicators, and move history
- Manages scoreboard with sessionStorage persistence

### Test Suite (`test.html`)
- Comprehensive tests for all win scenarios
- Edge case validation (boundaries, corners)
- False positive prevention (3-in-a-row, disconnected pieces)
- Visual board state for debugging

## 🧪 Test Coverage

The test suite validates:

✅ **Horizontal wins** in opponent territory (valid)
✅ **Vertical wins** in opponent territory (valid)
✅ **Diagonal wins** (both directions) in opponent territory (valid)
✅ **Boundary wins** at rows 3-4 (edge of territories)
✅ **Corner wins** (top-left, bottom-right)
❌ **Wins in home territory** (correctly rejected)
❌ **Wins crossing the boundary** (correctly rejected)
❌ **3-in-a-row** without 4th piece (no false positives)
❌ **Disconnected pieces** (gaps in the line)

**FIFO-Based Caps Tests (vNext):**
✅ **Total cap at 15** enforced correctly
✅ **Total cap exceeded** triggers automatic FIFO removal from home
✅ **Invasion cap at 8** triggers automatic penalty removal from home
✅ **FIFO selection** removes oldest piece by placement order
✅ **Fallback to oldest-anywhere** when no home pieces exist
✅ **Resolution order** invasion penalty → total cap → win check
✅ **Win detection** occurs after all cap removals
✅ **Configurable caps** totalCap and invasionCap
✅ **Placement order tracking** with pieceData array
✅ **Removal reasons** tracked (invasion_penalty vs total_cap)
✅ **Independent tracking** per player

## 🔮 Future Enhancements

The architecture is designed for extensibility:

- **Checkers-like movement**: Add diagonal movement and capture rules
- **AI opponent**: Minimax algorithm (game engine is ready)
- **Configurable board sizes**: Support 6×6, 10×10, etc.
- **Variable win lengths**: 3-in-a-row, 5-in-a-row modes
- **Online multiplayer**: Real-time play with WebSockets
- **Undo/Redo system**: Full move history navigation (partial implementation included)

## 🎨 Features

- **Beautiful UI**: Modern gradient design with smooth animations
- **Responsive**: Works on desktop and mobile devices
- **Accessibility**: ARIA labels and semantic HTML
- **Score tracking**: Persistent across games in the same session
- **Move history**: Review all moves made during the game
- **Visual feedback**: Winning line highlighted in gold
- **Undo functionality**: Take back your last move

## 🛠️ Technologies

- **Vanilla JavaScript** (ES6+) - No frameworks required
- **CSS Grid** - Perfect for board layout
- **CSS Custom Properties** - Themeable design system
- **SessionStorage** - Score persistence

## 📝 Development Notes

### Adding New Features

To add movement rules (future):
```javascript
// In GameEngine class
applyMovement(fromIndex, toIndex) {
  // Validate diagonal movement
  // Check for captures
  // Update board state
}
```

To add AI opponent:
```javascript
// Minimax is already compatible with the game engine
function getBestMove(gameState) {
  return minimax(gameState, true);
}
```

### Running Tests

Simply open `test.html` in a browser. All tests run automatically and display results.

Expected output: **All tests pass** ✓

---

## 🎯 Tic-Tac-Toe 2: Infiltration v1.1 - Detailed Rules

### Game Overview
Infiltration v1.1 is a 2-player strategic board game with flexible 8-directional movement and the territorial objective of getting 4-in-a-row in enemy territory.

### Version 1.1 Changes
- **Movement**: Now any adjacent square (8 directions) instead of diagonal-forward only
- **Captures**: Jump 2 squares in any straight line (not just diagonal)
- **Piece Count**: Increased to 10 pieces per player (up from 8)
- **Kings Removed**: All pieces move omnidirectionally by default
- **Multi-Jump**: Can continue capturing in the same turn (optional)

### Setup
- **Board**: 8×8 checkered grid
- **Players**: X (bottom) and O (top)
- **Pieces**: Each player starts with 10 pieces (configurable: 4-16)
- **Territories**:
  - **Top half (rows 1-4)**: O's home, X's target zone
  - **Bottom half (rows 5-8)**: X's home, O's target zone

### Phase 1: Deployment
1. Players alternate placing one piece per turn
2. Pieces **must** be placed in your home territory only
3. Once all pieces are placed (10 per player by default), Phase 2 begins

### Phase 2: Movement & Infiltration

**Movement Rules (v1.1):**
- Select one of your pieces
- **Standard Move**: Move 1 square to any adjacent empty square
  - All 8 directions available: N, S, E, W, NE, NW, SE, SW
  - No forward/backward restrictions
  - No king promotion needed - all pieces move omnidirectionally

**Capture Rules (if enabled):**
- **Jump**: Move 2 squares in a straight line (orthogonal or diagonal) over an adjacent enemy into an empty square
- **All 8 directions** available for captures: N, S, E, W, NE, NW, SE, SW
- Remove the jumped piece from the board
- Captured piece returns to the owner's inventory
- On your next turn, you may re-place the captured piece in your home territory (instead of moving)
- **Multi-jump** (optional): If another capture is available from the landing square, you may continue capturing
- **Forced capture** (optional): If you can capture, you must capture

### Win Condition
At the end of your turn, if you have **4 pieces in a row** (horizontal, vertical, or diagonal) **entirely within your opponent's territory**, you win immediately!

**Critical Rules:**
- All 4 pieces must be in opponent territory (no mixed territory wins)
- Win is checked after every move
- First player to achieve this wins

### Optional Rules (Tuning Knobs)

**Piece Count** (4-16)
- Default: 10 pieces per player (v1.1)
- More pieces = longer, more complex game

**Capture** (ON/OFF)
- Default: ON
- OFF = pieces cannot be captured (pure movement game)

**Multi-Jump** (ON/OFF) - NEW in v1.1
- Default: ON
- ON = can continue capturing in the same turn
- OFF = one capture per turn maximum

**Forced Capture** (ON/OFF)
- Default: OFF
- ON = if you can capture, you must (like international checkers)

**Pie Rule** (ON/OFF)
- Default: OFF
- ON = after X's first placement, O can choose to swap colors
- Balances first-player advantage

### Strategy Tips (v1.1)
1. **Flexible positioning**: With 8-directional movement, pieces are more mobile - use this to your advantage
2. **Control the center**: Center squares provide maximum movement options (up to 8 directions)
3. **Orthogonal power**: Don't underestimate horizontal/vertical moves - they're now just as valid as diagonal
4. **Threaten multiple lines**: Force opponent to defend multiple potential 4-in-a-rows
5. **Capture chains**: With multi-jump enabled, set up opportunities for multiple captures in one turn
6. **Use captures wisely**: Trading pieces can open up board position, and captured pieces return to inventory
7. **Defensive walls**: Use orthogonal positioning to block opponent's advance more effectively
8. **Infiltration timing**: Balance between advancing to opponent territory and maintaining defensive position

### Files (v1.1)
- `infiltration.html` - Main game interface (v1.1 UI)
- `infiltration-engine.js` - Game logic engine (v1.1 rules)
- `infiltration-test.html` - Comprehensive test suite (v1.1 - all tests pass ✓)

---

## 📜 License

This is an autonomous test project.

## 🙋 Questions?

The game rules are displayed in the UI, but here's a quick reminder:

> **To win**: Get 4-in-a-row entirely in your opponent's half of the board.
> **X wins in**: Top half (O's territory)
> **O wins in**: Bottom half (X's territory)

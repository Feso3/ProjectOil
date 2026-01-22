# ProjectOil - Strategic Board Games Collection

A collection of innovative tic-tac-toe variants with strategic depth, territorial gameplay, and checkers-inspired mechanics.

## 🎮 Games

### 1. **Tic-Tac-Toe 2: Infiltration** (NEW!)
The ultimate strategic evolution combining checkers movement with territorial objectives.

**Two-Phase Gameplay:**
- **Phase 1 (Placement)**: Players alternate placing 8 pieces in their home territory
- **Phase 2 (Movement)**: Move pieces diagonally, capture enemies, promote to kings, and infiltrate

**Win Condition:** Create 4-in-a-row (H/V/D) entirely in your opponent's territory

**Key Features:**
- Checkers-style diagonal movement (forward for regular pieces, both directions for kings)
- Capture mechanics: Jump over adjacent enemies, return captured pieces to owner's inventory
- King promotion: Reach the far edge to move in all diagonal directions
- Configurable rules: Toggle pieces count, captures, kings, forced capture, pie rule

[Play Infiltration](infiltration.html) | [View Tests](infiltration-test.html)

---

### 2. **Checkerboard Tic-Tac-Toe**
A strategic twist on classic tic-tac-toe with territorial gameplay on an 8×8 checkered board.

## 🎮 Game Rules

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

### Gameplay
- Players alternate turns placing their piece (X or O) on any empty square
- After each move, the game checks for a valid win condition
- The game ends when a player achieves a valid 4-in-a-row or the board is full (draw)

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
  - `applyMove(index)`: Apply a move and check win conditions
  - `checkWin(player)`: Validate 4-in-a-row with territory constraint
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

## 🎯 Tic-Tac-Toe 2: Infiltration - Detailed Rules

### Game Overview
Infiltration is a 2-player strategic board game that combines checkers-style movement with the territorial objective of getting 4-in-a-row in enemy territory.

### Setup
- **Board**: 8×8 checkered grid
- **Players**: X (bottom) and O (top)
- **Pieces**: Each player starts with 8 pieces (configurable: 4-16)
- **Territories**:
  - **Top half (rows 1-4)**: O's home, X's target zone
  - **Bottom half (rows 5-8)**: X's home, O's target zone

### Phase 1: Placement
1. Players alternate placing one piece per turn
2. Pieces **must** be placed in your home territory only
3. Once all pieces are placed (8 per player by default), Phase 2 begins

### Phase 2: Movement & Infiltration

**Movement Rules:**
- Select one of your pieces
- Move **diagonally forward** one space into an empty square
- Forward direction: X moves up (toward row 0), O moves down (toward row 7)
- Regular pieces can only move forward; Kings can move any diagonal direction

**Capture Rules** (if enabled):
- Jump diagonally over an adjacent enemy piece into an empty square beyond
- Remove the jumped piece from the board
- Captured piece returns to the owner's inventory
- On your next turn, you may re-place the captured piece in your home territory (instead of moving)
- Forced capture (optional): If you can capture, you must capture

**King Promotion** (if enabled):
- X pieces reaching row 0 (top edge) become kings 👑
- O pieces reaching row 7 (bottom edge) become kings 👑
- Kings can move diagonally in ALL directions (forward and backward)
- Kings maintain promotion after being captured and re-placed

### Win Condition
At the end of your turn, if you have **4 pieces in a row** (horizontal, vertical, or diagonal) **entirely within your opponent's territory**, you win immediately!

**Critical Rules:**
- All 4 pieces must be in opponent territory (no mixed territory wins)
- Win is checked after every move
- First player to achieve this wins

### Optional Rules (Tuning Knobs)

**Piece Count** (4-16)
- Default: 8 pieces per player
- More pieces = longer, more complex game

**Capture** (ON/OFF)
- Default: ON
- OFF = pieces cannot be captured (pure movement game)

**Kings** (ON/OFF)
- Default: ON
- OFF = no promotion, pieces always move forward only

**Forced Capture** (ON/OFF)
- Default: OFF
- ON = if you can capture, you must (like international checkers)

**Pie Rule** (ON/OFF)
- Default: OFF
- ON = after X's first placement, O can choose to swap colors
- Balances first-player advantage

### Strategy Tips
1. **Build forward gradually**: Don't rush all pieces to the front
2. **Control the center**: Center squares provide more movement options
3. **Threaten multiple lines**: Force opponent to defend multiple potential 4-in-a-rows
4. **Use captures wisely**: Trading pieces can open up board position
5. **King timing**: Promoting too early can leave kings exposed
6. **Defensive positioning**: Block opponent's potential 4-in-a-row opportunities

### Files
- `infiltration.html` - Main game interface
- `infiltration-engine.js` - Game logic engine
- `infiltration-test.html` - Comprehensive test suite (all tests pass ✓)

---

## 📜 License

This is an autonomous test project.

## 🙋 Questions?

The game rules are displayed in the UI, but here's a quick reminder:

> **To win**: Get 4-in-a-row entirely in your opponent's half of the board.
> **X wins in**: Top half (O's territory)
> **O wins in**: Bottom half (X's territory)

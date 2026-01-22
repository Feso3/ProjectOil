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

### 2. **Checkerboard Tic-Tac-Toe (Staged Opening + FIFO)**
A strategic twist on classic tic-tac-toe with a structured opening phase and FIFO-based piece limits on an 8×8 checkered board.

## 🎮 Game Rules (Staged Opening + FIFO)

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

### Staged Opening Phase (6 Plies)

The game begins with a **structured opening** that forces both players to develop pieces on specific halves:

**Round 1 (Plies 1-2)**: Both players place on **X's half** (bottom, rows 5-8)
- Ply 1: X places on X's half
- Ply 2: O places on X's half

**Round 2 (Plies 3-4)**: Both players place on **O's half** (top, rows 1-4)
- Ply 3: X places on O's half
- Ply 4: O places on O's half

**Round 3 (Plies 5-6)**: Both players place on **X's half** again
- Ply 5: X places on X's half
- Ply 6: O places on X's half

**After Opening**: Each player has exactly **3 pieces** on the board, and the game transitions to the Open Game phase.

### Open Game Phase (After Ply 6)

After the opening completes:
- **Placement**: Players can place on any empty square (no territory restrictions)
- **Piece Limit**: Each player may have at most **MAX_ON_BOARD_PER_PLAYER = 8** pieces (configurable)
- **FIFO Removal**: When placing a 9th piece, your **oldest piece** is **automatically removed** (First In, First Out)

**FIFO Behavior**:
- Pieces are tracked by placement order (plyIndex)
- When you exceed the cap (8 pieces), your oldest piece is removed
- The just-placed piece is never removed
- UI shows a preview highlight on the piece that will be removed before you place

#### Resolution Order (Critical!)
When you place a piece during Open Game, the following happens **in this exact order**:

1. **Place** your piece on the board
2. **FIFO Removal** (if you now have 9 pieces, remove oldest)
3. **Win Check** (4-in-a-row validation after removal)
4. **Turn Switch** (if no win)

**Why this order matters**: FIFO removal happens BEFORE win detection, so your win condition is checked with the final board state (after removal).

### Gameplay Summary
- **Opening (Plies 1-6)**: Follow structured placement pattern (see above)
- **Open Game (Ply 7+)**: Place anywhere, FIFO removal at 9 pieces
- **UI Features**:
  - Phase indicator shows "Opening (Step X/6)" or "Open Game"
  - Per-player counters show piece count (e.g., "X: 7/8")
  - Orange highlight preview shows which piece will be removed if you're at cap
  - Move history marks opening moves with 🔷 and FIFO removals with [FIFO]
- **Win**: First player to get 4-in-a-row entirely in opponent's territory wins

### Example Scenarios

**Scenario 1: Opening Phase Restrictions**
- **Ply 1** (X's turn): X can only place on rows 5-8 (X's half). Placing on rows 1-4 is invalid.
- **Ply 3** (X's turn): X can only place on rows 1-4 (O's half). Placing on rows 5-8 is invalid.
- **Ply 7** (X's turn, Open Game): X can place anywhere on any empty square.

**Scenario 2: FIFO Removal at Cap**
- X has 8 pieces on board (at cap: 8/8)
- X's oldest piece was placed on ply 0 at index 40
- X places a 9th piece at index 20
- **Result**: Oldest piece (index 40, ply 0) is automatically removed
- Net effect: X still has 8 pieces (7 old + 1 new)

**Scenario 3: Win Detection After FIFO**
- O has 8 pieces including 3-in-a-row at indices 0, 1, 2 (in X's half)
- O places 9th piece at index 3, completing 4-in-a-row (0-1-2-3)
- O's oldest piece (from ply 1) is removed by FIFO
- **Result**: Win is detected after FIFO removal (4-in-a-row still intact at 0-1-2-3)

**Scenario 4: FIFO Preview Highlight**
- X has 8 pieces (at cap: 8/8)
- X's oldest piece is at index 45 (placed on ply 0)
- When hovering over the board, index 45 shows orange border (FIFO preview)
- This tells X: "If you place now, this piece will be removed"

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
  - `applyMove(index)`: Apply move with phase validation and automatic FIFO removal
  - `getRequiredHalfForOpening()`: Returns required half ('X' or 'O') for current opening ply
  - `isValidMove(index)`: Check if move is valid for current phase (opening restrictions or open game)
  - `findOldestPiece(player)`: Find oldest piece by plyIndex for FIFO removal
  - `getPieceToRemovePreview(player)`: Get piece that would be removed if player places now (for UI preview)
  - `countPlayerPieces(player)`: Count total pieces for player on board
  - `checkWin(player)`: Validate 4-in-a-row entirely in opponent's half
  - `isInOpponentHalf(index, player)`: Check if position is in opponent territory
  - `isInXHalf(index)` / `isInOHalf(index)`: Check territory by half
  - `getValidMoves()`: Get all valid empty positions for current phase
  - `reset()`: Start a new game (opening phase)
  - `getState()`/`loadState()`: Save/restore game state including phase and pieceData

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

**Staged Opening + FIFO Tests:**
✅ **Opening phase initialization** starts at ply 0 in OPENING phase
✅ **Opening restrictions** enforce correct halves for plies 0-1 (X half), 2-3 (O half), 4-5 (X half)
✅ **Invalid opening moves** correctly rejected (wrong half for current ply)
✅ **Phase transition** to OPEN_GAME after ply 6
✅ **FIFO removal** triggers when placing 9th piece (exceeds MAX_ON_BOARD_PER_PLAYER)
✅ **FIFO selection** removes oldest piece by plyIndex (placement order)
✅ **Win detection after FIFO** validates 4-in-a-row after removal completes
✅ **FIFO preview** correctly identifies piece to be removed before placement
✅ **Configurable maxOnBoard** allows custom piece limits (default: 8)
✅ **Placement order tracking** with pieceData array storing {player, plyIndex}
✅ **Independent piece counting** per player with separate caps

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

# Checkerboard Tic-Tac-Toe

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

### Option 1: Web Version (Recommended)
1. Open `checkerboard-tictactoe.html` in any modern web browser
2. No build tools or installation required - it's completely self-contained
3. Click on any empty square to place your piece
4. The game automatically validates moves and detects wins

### Option 2: Run Tests
1. Open `test.html` in your web browser
2. View comprehensive test results for the game engine
3. All tests should pass, validating the win detection logic

## 📁 Project Structure

```
ProjectOil/
├── checkerboard-tictactoe.html    # Main game (self-contained HTML/CSS/JS)
├── game-engine.js                 # Pure game logic (no UI dependencies)
├── test.html                      # Test suite with visual results
├── tictactoe.html                 # Legacy 3×3 tic-tac-toe (original)
├── main.py                        # Python CLI version (original, not updated)
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

## 📜 License

This is an autonomous test project.

## 🙋 Questions?

The game rules are displayed in the UI, but here's a quick reminder:

> **To win**: Get 4-in-a-row entirely in your opponent's half of the board.
> **X wins in**: Top half (O's territory)
> **O wins in**: Bottom half (X's territory)

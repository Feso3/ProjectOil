/**
 * Tic-Tac-Toe 2: Infiltration Game Engine v1.1
 *
 * A strategic board game with flexible movement and territorial objectives.
 *
 * Version 1.1 Changes:
 * - Movement: Any adjacent square (8 directions) instead of diagonal forward only
 * - Captures: Jump 2 squares in any straight line over enemy
 * - Piece count: 10 pieces per player (up from 8)
 * - Removed kings system (no longer needed with omnidirectional movement)
 *
 * Game Flow:
 * - Phase 1 (Deployment): Players alternate placing 10 pieces on their home half
 * - Phase 2 (Movement): Players move pieces to adjacent squares or capture by jumping
 *
 * Win Condition: Get 4-in-a-row (H/V/D) entirely in opponent's territory
 */

class InfiltrationEngine {
  constructor(config = {}) {
    // Board constants
    this.BOARD_SIZE = 8;
    this.CELLS_COUNT = 64;
    this.WIN_LENGTH = 4;
    this.EMPTY = "";
    this.PLAYER_X = "X";
    this.PLAYER_O = "O";
    this.VERSION = "1.1";

    // Configuration (tuning knobs)
    this.config = {
      pieceCount: config.pieceCount || 10,             // Pieces per player (v1.1: default 10)
      captureEnabled: config.captureEnabled !== false, // Can capture pieces
      forcedCapture: config.forcedCapture || false,    // Must capture if available
      multiJump: config.multiJump !== false,           // Allow multiple captures in one turn
      pieRule: config.pieRule || false                 // Second player can swap colors after first placement
    };

    // Game phases
    this.PHASE_PLACEMENT = "placement";
    this.PHASE_MOVEMENT = "movement";
    this.PHASE_PIE_DECISION = "pie_decision";

    // Territory boundaries
    this.TOP_HALF_MAX_INDEX = 31; // Rows 0-3 (O's home, X's opponent side)

    // All 8 directions (N, NE, E, SE, S, SW, W, NW)
    this.DIRECTIONS = [
      { dr: -1, dc: 0 },  // North
      { dr: -1, dc: 1 },  // Northeast
      { dr: 0, dc: 1 },   // East
      { dr: 1, dc: 1 },   // Southeast
      { dr: 1, dc: 0 },   // South
      { dr: 1, dc: -1 },  // Southwest
      { dr: 0, dc: -1 },  // West
      { dr: -1, dc: -1 }  // Northwest
    ];

    this.reset();
  }

  /**
   * Reset game to initial state
   */
  reset() {
    this.board = Array(this.CELLS_COUNT).fill(this.EMPTY);
    this.currentPlayer = this.PLAYER_X;
    this.phase = this.PHASE_PLACEMENT;
    this.gameOver = false;
    this.winner = null;
    this.winningLine = null;
    this.moveHistory = [];

    // Piece inventories (pieces not yet placed)
    this.inventory = {
      [this.PLAYER_X]: this.config.pieceCount,
      [this.PLAYER_O]: this.config.pieceCount
    };

    // Captured pieces returned to inventory for re-placement
    this.capturedPieces = {
      [this.PLAYER_X]: 0,
      [this.PLAYER_O]: 0
    };

    this.pieRuleUsed = false;
    this.selectedPiece = null;
    this.lastMoveWasCapture = false;
    this.canContinueCapture = false; // For multi-jump
    this.currentTurnPiece = null; // Track piece making multi-jump
  }

  /**
   * Convert index to row, col coordinates
   */
  indexToCoords(index) {
    return {
      row: Math.floor(index / this.BOARD_SIZE),
      col: index % this.BOARD_SIZE
    };
  }

  /**
   * Convert row, col to index
   */
  coordsToIndex(row, col) {
    return row * this.BOARD_SIZE + col;
  }

  /**
   * Check if index is in player's home territory
   */
  isInHomeTerritory(index, player) {
    if (player === this.PLAYER_X) {
      // X's home is bottom half (rows 4-7, indices 32-63)
      return index > this.TOP_HALF_MAX_INDEX;
    } else {
      // O's home is top half (rows 0-3, indices 0-31)
      return index <= this.TOP_HALF_MAX_INDEX;
    }
  }

  /**
   * Check if index is in player's opponent territory
   */
  isInOpponentTerritory(index, player) {
    return !this.isInHomeTerritory(index, player);
  }

  /**
   * PHASE 1: Place a piece during placement phase
   */
  placePiece(index) {
    if (this.phase === this.PHASE_PIE_DECISION) {
      return { success: false, message: "Waiting for pie rule decision" };
    }

    if (this.phase !== this.PHASE_PLACEMENT) {
      return { success: false, message: "Not in placement phase" };
    }

    if (this.board[index] !== this.EMPTY) {
      return { success: false, message: "Cell is occupied" };
    }

    // Must place in home territory
    if (!this.isInHomeTerritory(index, this.currentPlayer)) {
      return { success: false, message: "Must place pieces in your home territory" };
    }

    // Check if player has pieces to place
    if (this.inventory[this.currentPlayer] <= 0) {
      return { success: false, message: "No pieces left to place" };
    }

    // Place the piece
    this.board[index] = this.currentPlayer;
    this.inventory[this.currentPlayer]--;

    this.moveHistory.push({
      type: "placement",
      player: this.currentPlayer,
      index,
      ...this.indexToCoords(index)
    });

    // Check if this is the first placement and pie rule is enabled
    if (this.config.pieRule && this.moveHistory.length === 1) {
      this.phase = this.PHASE_PIE_DECISION;
      this.currentPlayer = this.PLAYER_O;
      return {
        success: true,
        message: "Piece placed. O can now invoke pie rule or continue.",
        phase: this.PHASE_PIE_DECISION
      };
    }

    // Check if placement phase is complete
    const allPiecesPlaced = this.inventory[this.PLAYER_X] === 0 &&
                           this.inventory[this.PLAYER_O] === 0;

    if (allPiecesPlaced) {
      this.phase = this.PHASE_MOVEMENT;
      return {
        success: true,
        message: "All pieces deployed. Movement phase begins!",
        phaseChange: true,
        phase: this.PHASE_MOVEMENT
      };
    }

    // Switch players
    this.currentPlayer = this.currentPlayer === this.PLAYER_X ? this.PLAYER_O : this.PLAYER_X;

    return {
      success: true,
      message: "Piece placed",
      phase: this.PHASE_PLACEMENT
    };
  }

  /**
   * PIE RULE: Second player swaps colors after first placement
   */
  invokePieRule() {
    if (this.phase !== this.PHASE_PIE_DECISION) {
      return { success: false, message: "Not in pie rule decision phase" };
    }

    const firstMove = this.moveHistory[0];
    this.board[firstMove.index] = this.PLAYER_O;

    const temp = this.inventory[this.PLAYER_X];
    this.inventory[this.PLAYER_X] = this.inventory[this.PLAYER_O];
    this.inventory[this.PLAYER_O] = temp;

    firstMove.player = this.PLAYER_O;
    firstMove.pieSwapped = true;

    this.pieRuleUsed = true;
    this.phase = this.PHASE_PLACEMENT;
    this.currentPlayer = this.PLAYER_X;

    return {
      success: true,
      message: "Pie rule invoked! Colors swapped.",
      phase: this.PHASE_PLACEMENT
    };
  }

  /**
   * Decline pie rule and continue normally
   */
  declinePieRule() {
    if (this.phase !== this.PHASE_PIE_DECISION) {
      return { success: false, message: "Not in pie rule decision phase" };
    }

    this.phase = this.PHASE_PLACEMENT;
    return {
      success: true,
      message: "Continuing normally",
      phase: this.PHASE_PLACEMENT
    };
  }

  /**
   * Get valid placement positions for current player
   */
  getValidPlacements() {
    if (this.phase !== this.PHASE_PLACEMENT) return [];
    if (this.inventory[this.currentPlayer] <= 0) return [];

    const valid = [];
    for (let i = 0; i < this.CELLS_COUNT; i++) {
      if (this.board[i] === this.EMPTY && this.isInHomeTerritory(i, this.currentPlayer)) {
        valid.push(i);
      }
    }
    return valid;
  }

  /**
   * PHASE 2 v1.1: Get valid moves for a piece
   * Standard move: 1 square to any adjacent empty square (8 directions)
   * Capture: Jump 2 squares in straight line over adjacent enemy into empty
   * Returns array of { to, type: 'move'|'capture', via: capturedIndex, direction }
   */
  getValidMovesForPiece(fromIndex) {
    if (this.phase !== this.PHASE_MOVEMENT) return [];
    if (this.board[fromIndex] !== this.currentPlayer) return [];

    const moves = [];
    const coords = this.indexToCoords(fromIndex);

    // Check all 8 directions
    for (const dir of this.DIRECTIONS) {
      // Check adjacent square (1 step)
      const adj1Row = coords.row + dir.dr;
      const adj1Col = coords.col + dir.dc;

      // Bounds check
      if (adj1Row < 0 || adj1Row >= this.BOARD_SIZE ||
          adj1Col < 0 || adj1Col >= this.BOARD_SIZE) {
        continue;
      }

      const adj1Index = this.coordsToIndex(adj1Row, adj1Col);

      // Standard move: adjacent empty square
      if (this.board[adj1Index] === this.EMPTY) {
        moves.push({ to: adj1Index, type: 'move', direction: dir });
      }
      // Capture: adjacent enemy, check if we can jump
      else if (this.config.captureEnabled &&
               this.board[adj1Index] !== this.currentPlayer) {
        // Check 2 squares away in same direction
        const adj2Row = coords.row + (dir.dr * 2);
        const adj2Col = coords.col + (dir.dc * 2);

        if (adj2Row >= 0 && adj2Row < this.BOARD_SIZE &&
            adj2Col >= 0 && adj2Col < this.BOARD_SIZE) {
          const adj2Index = this.coordsToIndex(adj2Row, adj2Col);

          if (this.board[adj2Index] === this.EMPTY) {
            moves.push({
              to: adj2Index,
              type: 'capture',
              via: adj1Index,
              direction: dir
            });
          }
        }
      }
    }

    return moves;
  }

  /**
   * Get all valid moves for current player
   */
  getAllValidMoves() {
    const allMoves = [];
    for (let i = 0; i < this.CELLS_COUNT; i++) {
      if (this.board[i] === this.currentPlayer) {
        const moves = this.getValidMovesForPiece(i);
        moves.forEach(move => {
          allMoves.push({ from: i, ...move });
        });
      }
    }
    return allMoves;
  }

  /**
   * Check if any captures are available
   */
  hasCaptureAvailable(fromIndex = null) {
    if (fromIndex !== null) {
      // Check for specific piece (for multi-jump)
      const moves = this.getValidMovesForPiece(fromIndex);
      return moves.some(move => move.type === 'capture');
    } else {
      // Check for any capture
      const allMoves = this.getAllValidMoves();
      return allMoves.some(move => move.type === 'capture');
    }
  }

  /**
   * PHASE 2 v1.1: Move a piece
   * Supports multi-jump if enabled
   */
  movePiece(fromIndex, toIndex) {
    if (this.phase !== this.PHASE_MOVEMENT) {
      return { success: false, message: "Not in movement phase" };
    }

    // If multi-jump in progress, only allow moves from the same piece
    if (this.canContinueCapture && this.currentTurnPiece !== null) {
      if (fromIndex !== this.currentTurnPiece) {
        return { success: false, message: "Must continue capturing with the same piece" };
      }
    }

    if (this.board[fromIndex] !== this.currentPlayer) {
      return { success: false, message: "Not your piece" };
    }

    // Get valid moves for this piece
    const validMoves = this.getValidMovesForPiece(fromIndex);
    const move = validMoves.find(m => m.to === toIndex);

    if (!move) {
      return { success: false, message: "Invalid move" };
    }

    // Forced capture rule
    if (this.config.forcedCapture && move.type !== 'capture' && !this.canContinueCapture) {
      if (this.hasCaptureAvailable()) {
        return { success: false, message: "Must capture when possible" };
      }
    }

    // Execute the move
    const piece = this.board[fromIndex];
    this.board[fromIndex] = this.EMPTY;
    this.board[toIndex] = piece;

    let capturedPiece = null;
    let isCapture = false;

    // Handle capture
    if (move.type === 'capture') {
      capturedPiece = this.board[move.via];
      this.board[move.via] = this.EMPTY;

      // Return captured piece to owner's inventory
      this.inventory[capturedPiece]++;
      this.capturedPieces[capturedPiece]++;

      isCapture = true;
      this.lastMoveWasCapture = true;
    } else {
      this.lastMoveWasCapture = false;
    }

    this.moveHistory.push({
      type: move.type,
      player: this.currentPlayer,
      from: fromIndex,
      to: toIndex,
      via: move.via,
      capturedPiece
    });

    // Check for multi-jump continuation
    if (this.config.multiJump && isCapture) {
      // Check if another capture is available from the landing square
      if (this.hasCaptureAvailable(toIndex)) {
        this.canContinueCapture = true;
        this.currentTurnPiece = toIndex;

        return {
          success: true,
          message: "Piece captured! Another capture available.",
          moveType: 'capture',
          captured: capturedPiece,
          canContinue: true,
          continueFrom: toIndex
        };
      }
    }

    // Reset multi-jump state
    this.canContinueCapture = false;
    this.currentTurnPiece = null;

    // Check for win
    const winResult = this.checkWin(this.currentPlayer);
    if (winResult.isWin) {
      this.gameOver = true;
      this.winner = this.currentPlayer;
      this.winningLine = winResult.line;
      return {
        success: true,
        message: `${this.currentPlayer} wins!`,
        gameOver: true,
        winner: this.currentPlayer,
        winningLine: winResult.line,
        moveType: move.type
      };
    }

    // Switch players
    this.currentPlayer = this.currentPlayer === this.PLAYER_X ? this.PLAYER_O : this.PLAYER_X;

    // Check for stalemate
    if (this.getAllValidMoves().length === 0) {
      if (this.inventory[this.currentPlayer] === 0) {
        this.gameOver = true;
        this.winner = this.currentPlayer === this.PLAYER_X ? this.PLAYER_O : this.PLAYER_X;
        return {
          success: true,
          message: `${this.winner} wins by stalemate!`,
          gameOver: true,
          winner: this.winner,
          moveType: move.type
        };
      }
    }

    return {
      success: true,
      message: isCapture ? "Piece captured!" : "Piece moved",
      moveType: move.type,
      captured: capturedPiece
    };
  }

  /**
   * End turn (for multi-jump - if player chooses not to continue)
   */
  endTurn() {
    if (!this.canContinueCapture) {
      return { success: false, message: "No turn to end" };
    }

    this.canContinueCapture = false;
    this.currentTurnPiece = null;

    // Check for win
    const winResult = this.checkWin(this.currentPlayer);
    if (winResult.isWin) {
      this.gameOver = true;
      this.winner = this.currentPlayer;
      this.winningLine = winResult.line;
      return {
        success: true,
        message: `${this.currentPlayer} wins!`,
        gameOver: true,
        winner: this.currentPlayer,
        winningLine: winResult.line
      };
    }

    // Switch players
    this.currentPlayer = this.currentPlayer === this.PLAYER_X ? this.PLAYER_O : this.PLAYER_X;

    return {
      success: true,
      message: "Turn ended"
    };
  }

  /**
   * Re-place a captured piece (if player has any in inventory from captures)
   */
  replaceCapturedPiece(index) {
    if (this.phase !== this.PHASE_MOVEMENT) {
      return { success: false, message: "Not in movement phase" };
    }

    if (this.capturedPieces[this.currentPlayer] <= 0) {
      return { success: false, message: "No captured pieces to replace" };
    }

    if (this.board[index] !== this.EMPTY) {
      return { success: false, message: "Cell is occupied" };
    }

    if (!this.isInHomeTerritory(index, this.currentPlayer)) {
      return { success: false, message: "Must place in home territory" };
    }

    this.board[index] = this.currentPlayer;
    this.inventory[this.currentPlayer]--;
    this.capturedPieces[this.currentPlayer]--;

    this.moveHistory.push({
      type: "replacement",
      player: this.currentPlayer,
      index,
      ...this.indexToCoords(index)
    });

    // Switch players
    this.currentPlayer = this.currentPlayer === this.PLAYER_X ? this.PLAYER_O : this.PLAYER_X;

    return {
      success: true,
      message: "Captured piece replaced"
    };
  }

  /**
   * Check for win: 4-in-a-row entirely in opponent's territory
   */
  checkWin(player) {
    const directions = [
      { dr: 0, dc: 1 },  // Horizontal
      { dr: 1, dc: 0 },  // Vertical
      { dr: 1, dc: 1 },  // Diagonal down-right
      { dr: 1, dc: -1 }  // Diagonal down-left
    ];

    for (let row = 0; row < this.BOARD_SIZE; row++) {
      for (let col = 0; col < this.BOARD_SIZE; col++) {
        for (const dir of directions) {
          const line = this.checkLineFromPosition(row, col, dir.dr, dir.dc, player);
          if (line && line.length === this.WIN_LENGTH) {
            if (this.isLineInOpponentTerritory(line, player)) {
              return { isWin: true, line };
            }
          }
        }
      }
    }

    return { isWin: false, line: null };
  }

  /**
   * Check if all indices in a line are in opponent's territory
   */
  isLineInOpponentTerritory(line, player) {
    return line.every(index => this.isInOpponentTerritory(index, player));
  }

  /**
   * Check for a line from a position
   */
  checkLineFromPosition(startRow, startCol, dr, dc, player) {
    const line = [];

    for (let i = 0; i < this.WIN_LENGTH; i++) {
      const row = startRow + i * dr;
      const col = startCol + i * dc;

      if (row < 0 || row >= this.BOARD_SIZE || col < 0 || col >= this.BOARD_SIZE) {
        return null;
      }

      const index = this.coordsToIndex(row, col);

      if (this.board[index] !== player) {
        return null;
      }

      line.push(index);
    }

    return line;
  }

  /**
   * Get game state for serialization
   */
  getState() {
    return {
      version: this.VERSION,
      board: [...this.board],
      currentPlayer: this.currentPlayer,
      phase: this.phase,
      gameOver: this.gameOver,
      winner: this.winner,
      winningLine: this.winningLine ? [...this.winningLine] : null,
      inventory: { ...this.inventory },
      capturedPieces: { ...this.capturedPieces },
      moveHistory: [...this.moveHistory],
      config: { ...this.config },
      pieRuleUsed: this.pieRuleUsed,
      canContinueCapture: this.canContinueCapture,
      currentTurnPiece: this.currentTurnPiece
    };
  }
}

// Export for use in browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InfiltrationEngine;
}

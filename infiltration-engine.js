/**
 * Tic-Tac-Toe 2: Infiltration Game Engine
 *
 * A strategic board game combining checkers movement with territorial objectives.
 *
 * Game Flow:
 * - Phase 1 (Placement): Players alternate placing pieces on their home half
 * - Phase 2 (Movement): Players move pieces diagonally, capture enemies, and aim for 4-in-a-row
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

    // Configuration (tuning knobs)
    this.config = {
      pieceCount: config.pieceCount || 8,           // Pieces per player
      captureEnabled: config.captureEnabled !== false, // Can capture pieces
      kingsEnabled: config.kingsEnabled !== false,     // Pieces can become kings
      forcedCapture: config.forcedCapture || false,    // Must capture if available
      pieRule: config.pieRule || false                 // Second player can swap colors after first placement
    };

    // Game phases
    this.PHASE_PLACEMENT = "placement";
    this.PHASE_MOVEMENT = "movement";
    this.PHASE_PIE_DECISION = "pie_decision"; // After first placement, O decides to swap or not

    // Territory boundaries
    this.TOP_HALF_MAX_INDEX = 31; // Rows 0-3 (O's home, X's opponent side)

    this.reset();
  }

  /**
   * Reset game to initial state
   */
  reset() {
    this.board = Array(this.CELLS_COUNT).fill(this.EMPTY);
    this.kings = new Set(); // Indices of promoted pieces
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
    this.selectedPiece = null; // For UI: which piece is selected for movement
    this.lastMoveWasCapture = false;
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
   * Check if a piece is a king
   */
  isKing(index) {
    return this.kings.has(index);
  }

  /**
   * Get forward direction for a player (row delta)
   * X moves up (negative), O moves down (positive)
   */
  getForwardDirection(player) {
    return player === this.PLAYER_X ? -1 : 1;
  }

  /**
   * Check if a piece has reached the far edge and should be promoted
   */
  shouldPromoteToKing(index, player) {
    if (!this.config.kingsEnabled) return false;

    const coords = this.indexToCoords(index);
    if (player === this.PLAYER_X) {
      return coords.row === 0; // Reached top edge
    } else {
      return coords.row === 7; // Reached bottom edge
    }
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
      // Don't switch player here - keep same player for first move
      return {
        success: true,
        message: "All pieces placed. Movement phase begins!",
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

    // Swap the piece on the board
    const firstMove = this.moveHistory[0];
    this.board[firstMove.index] = this.PLAYER_O;

    // Swap inventories
    const temp = this.inventory[this.PLAYER_X];
    this.inventory[this.PLAYER_X] = this.inventory[this.PLAYER_O];
    this.inventory[this.PLAYER_O] = temp;

    // Update history
    firstMove.player = this.PLAYER_O;
    firstMove.pieSwapped = true;

    this.pieRuleUsed = true;
    this.phase = this.PHASE_PLACEMENT;
    // X now places (since O used pie rule)
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
    // O continues placing normally (already current player)

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
   * PHASE 2: Get valid moves for a piece
   * Returns array of { to, type: 'move'|'capture', via: capturedIndex }
   */
  getValidMovesForPiece(fromIndex) {
    if (this.phase !== this.PHASE_MOVEMENT) return [];
    if (this.board[fromIndex] !== this.currentPlayer) return [];

    const moves = [];
    const coords = this.indexToCoords(fromIndex);
    const isKing = this.isKing(fromIndex);
    const forwardDir = this.getForwardDirection(this.currentPlayer);

    // Determine which directions this piece can move
    const directions = isKing ? [1, -1] : [forwardDir]; // Kings move both ways

    for (const rowDir of directions) {
      for (const colDir of [-1, 1]) { // Left and right
        const newRow = coords.row + rowDir;
        const newCol = coords.col + colDir;

        // Check bounds
        if (newRow < 0 || newRow >= this.BOARD_SIZE ||
            newCol < 0 || newCol >= this.BOARD_SIZE) {
          continue;
        }

        const toIndex = this.coordsToIndex(newRow, newCol);

        // Regular move to empty square
        if (this.board[toIndex] === this.EMPTY) {
          moves.push({ to: toIndex, type: 'move' });
        }
        // Capture move
        else if (this.config.captureEnabled &&
                 this.board[toIndex] !== this.currentPlayer) {
          // Check if we can jump over enemy
          const jumpRow = coords.row + (rowDir * 2);
          const jumpCol = coords.col + (colDir * 2);

          if (jumpRow >= 0 && jumpRow < this.BOARD_SIZE &&
              jumpCol >= 0 && jumpCol < this.BOARD_SIZE) {
            const jumpIndex = this.coordsToIndex(jumpRow, jumpCol);

            if (this.board[jumpIndex] === this.EMPTY) {
              moves.push({
                to: jumpIndex,
                type: 'capture',
                via: toIndex // The captured piece
              });
            }
          }
        }
      }
    }

    return moves;
  }

  /**
   * Get all valid moves for current player (for forced capture check)
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
  hasCaptureAvailable() {
    const allMoves = this.getAllValidMoves();
    return allMoves.some(move => move.type === 'capture');
  }

  /**
   * PHASE 2: Move a piece
   */
  movePiece(fromIndex, toIndex) {
    if (this.phase !== this.PHASE_MOVEMENT) {
      return { success: false, message: "Not in movement phase" };
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
    if (this.config.forcedCapture && move.type !== 'capture') {
      if (this.hasCaptureAvailable()) {
        return { success: false, message: "Must capture when possible" };
      }
    }

    // Execute the move
    const piece = this.board[fromIndex];
    const wasKing = this.isKing(fromIndex);

    this.board[fromIndex] = this.EMPTY;
    this.board[toIndex] = piece;

    // Update king status
    if (wasKing) {
      this.kings.delete(fromIndex);
      this.kings.add(toIndex);
    }

    let capturedPiece = null;

    // Handle capture
    if (move.type === 'capture') {
      capturedPiece = this.board[move.via];
      this.board[move.via] = this.EMPTY;

      // Remove king status if captured piece was a king
      this.kings.delete(move.via);

      // Return captured piece to owner's inventory
      this.inventory[capturedPiece]++;
      this.capturedPieces[capturedPiece]++;

      this.lastMoveWasCapture = true;
    } else {
      this.lastMoveWasCapture = false;
    }

    // Check for king promotion
    if (!wasKing && this.shouldPromoteToKing(toIndex, this.currentPlayer)) {
      this.kings.add(toIndex);
    }

    this.moveHistory.push({
      type: move.type,
      player: this.currentPlayer,
      from: fromIndex,
      to: toIndex,
      via: move.via,
      capturedPiece,
      promoted: this.isKing(toIndex) && !wasKing
    });

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

    // Check for stalemate (no valid moves)
    this.currentPlayer = this.currentPlayer === this.PLAYER_X ? this.PLAYER_O : this.PLAYER_X;

    if (this.getAllValidMoves().length === 0) {
      // No valid moves - check if they have pieces to place
      if (this.inventory[this.currentPlayer] === 0) {
        this.gameOver = true;
        // The player who just moved wins by stalemate
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
      message: move.type === 'capture' ? "Piece captured!" : "Piece moved",
      moveType: move.type,
      captured: capturedPiece,
      promoted: this.isKing(toIndex) && !wasKing
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

    // Place the piece
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
   * (Reusing logic from base game)
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
            // Check if line is entirely in opponent's territory
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
      board: [...this.board],
      kings: Array.from(this.kings),
      currentPlayer: this.currentPlayer,
      phase: this.phase,
      gameOver: this.gameOver,
      winner: this.winner,
      winningLine: this.winningLine ? [...this.winningLine] : null,
      inventory: { ...this.inventory },
      capturedPieces: { ...this.capturedPieces },
      moveHistory: [...this.moveHistory],
      config: { ...this.config },
      pieRuleUsed: this.pieRuleUsed
    };
  }
}

// Export for use in browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InfiltrationEngine;
}

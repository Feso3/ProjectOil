"""Single-player Tic-Tac-Toe (X vs O) with a computer opponent."""

from typing import List, Optional, Tuple

PLAYER = "X"
COMPUTER = "O"
EMPTY = " "


def display_board(board: List[str]) -> None:
    """Display the current board state."""
    print("\n")
    print("   1   2   3")
    print("1  {} | {} | {}".format(board[0], board[1], board[2]))
    print("  ---+---+---")
    print("2  {} | {} | {}".format(board[3], board[4], board[5]))
    print("  ---+---+---")
    print("3  {} | {} | {}".format(board[6], board[7], board[8]))
    print("\n")


def check_win(board: List[str], symbol: str) -> bool:
    """Return True if the given symbol has a winning line."""
    win_lines = [
        (0, 1, 2),
        (3, 4, 5),
        (6, 7, 8),
        (0, 3, 6),
        (1, 4, 7),
        (2, 5, 8),
        (0, 4, 8),
        (2, 4, 6),
    ]
    return any(all(board[i] == symbol for i in line) for line in win_lines)


def check_draw(board: List[str]) -> bool:
    """Return True if the board is full with no winner."""
    return all(cell != EMPTY for cell in board)


def get_available_moves(board: List[str]) -> List[int]:
    """Return a list of empty positions (0-based indices)."""
    return [index for index, cell in enumerate(board) if cell == EMPTY]


def make_move(board: List[str], index: int, symbol: str) -> None:
    """Place a symbol on the board."""
    board[index] = symbol


def minimax(board: List[str], is_maximizing: bool) -> Tuple[int, Optional[int]]:
    """Minimax algorithm to choose the optimal move for the computer."""
    if check_win(board, COMPUTER):
        return 1, None
    if check_win(board, PLAYER):
        return -1, None
    if check_draw(board):
        return 0, None

    best_score = -float("inf") if is_maximizing else float("inf")
    best_move: Optional[int] = None

    for move in get_available_moves(board):
        board[move] = COMPUTER if is_maximizing else PLAYER
        score, _ = minimax(board, not is_maximizing)
        board[move] = EMPTY

        if is_maximizing and score > best_score:
            best_score = score
            best_move = move
        if not is_maximizing and score < best_score:
            best_score = score
            best_move = move

    return best_score, best_move


def get_player_move(board: List[str]) -> int:
    """Prompt the player for a valid move and return the index."""
    while True:
        move = input("Choose your move (row,col) e.g. 1,3: ").strip()
        if "," not in move:
            print("Please use the format row,col (e.g. 2,1).")
            continue
        row_str, col_str = (part.strip() for part in move.split(",", 1))
        if not row_str.isdigit() or not col_str.isdigit():
            print("Row and column must be numbers between 1 and 3.")
            continue

        row = int(row_str)
        col = int(col_str)
        if row not in (1, 2, 3) or col not in (1, 2, 3):
            print("Row and column must each be between 1 and 3.")
            continue

        index = (row - 1) * 3 + (col - 1)
        if board[index] != EMPTY:
            print("That square is already taken. Try again.")
            continue

        return index


def get_computer_move(board: List[str]) -> int:
    """Compute the best move for the computer using minimax."""
    _, move = minimax(board, True)
    return move if move is not None else get_available_moves(board)[0]


def play_game() -> None:
    """Run a single game loop."""
    board = [EMPTY] * 9
    current_player = PLAYER

    print("Welcome to Tic-Tac-Toe! You are X, the computer is O.")
    display_board(board)

    while True:
        if current_player == PLAYER:
            move = get_player_move(board)
            make_move(board, move, PLAYER)
        else:
            print("Computer is thinking...")
            move = get_computer_move(board)
            make_move(board, move, COMPUTER)

        display_board(board)

        if check_win(board, current_player):
            winner = "You" if current_player == PLAYER else "Computer"
            print(f"{winner} win{'s' if winner == 'Computer' else ''}!")
            break

        if check_draw(board):
            print("It's a draw!")
            break

        current_player = COMPUTER if current_player == PLAYER else PLAYER


def ask_play_again() -> bool:
    """Return True if the player wants to play again."""
    while True:
        response = input("Play again? (y/n): ").strip().lower()
        if response in {"y", "yes"}:
            return True
        if response in {"n", "no"}:
            return False
        print("Please enter 'y' or 'n'.")


def main() -> None:
    """Entry point for the game."""
    while True:
        play_game()
        if not ask_play_again():
            print("Thanks for playing!")
            break


if __name__ == "__main__":
    main()

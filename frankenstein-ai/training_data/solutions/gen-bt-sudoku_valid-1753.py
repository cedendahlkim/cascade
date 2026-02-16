# Task: gen-bt-sudoku_valid-1753 | Score: 100% | 2026-02-12T18:30:02.511115

def solve_sudoku():
    grid = []
    for _ in range(9):
        grid.append(list(map(int, input().split())))

    def is_valid(board, row, col, num):
        for i in range(9):
            if board[row][i] == num:
                return False
            if board[i][col] == num:
                return False
            if board[3 * (row // 3) + i // 3][3 * (col // 3) + i % 3] == num:
                return False
        return True

    def is_sudoku_valid(board):
        for row in range(9):
            seen = set()
            for col in range(9):
                if board[row][col] != 0:
                    if board[row][col] in seen:
                        return False
                    seen.add(board[row][col])

        for col in range(9):
            seen = set()
            for row in range(9):
                if board[row][col] != 0:
                    if board[row][col] in seen:
                        return False
                    seen.add(board[row][col])

        for box_row in range(3):
            for box_col in range(3):
                seen = set()
                for i in range(3):
                    for j in range(3):
                        num = board[box_row * 3 + i][box_col * 3 + j]
                        if num != 0:
                            if num in seen:
                                return False
                            seen.add(num)
        return True

    if is_sudoku_valid(grid):
        print("valid")
    else:
        print("invalid")

solve_sudoku()
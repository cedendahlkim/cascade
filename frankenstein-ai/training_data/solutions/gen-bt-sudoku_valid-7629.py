# Task: gen-bt-sudoku_valid-7629 | Score: 100% | 2026-02-12T10:29:10.882796

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

    def find_empty(board):
        for i in range(9):
            for j in range(9):
                if board[i][j] == 0:
                    return (i, j)
        return None

    def is_sudoku_valid(board):
        for i in range(9):
            row_nums = set()
            col_nums = set()
            for j in range(9):
                if board[i][j] != 0:
                    if board[i][j] in row_nums:
                        return False
                    row_nums.add(board[i][j])
                if board[j][i] != 0:
                    if board[j][i] in col_nums:
                        return False
                    col_nums.add(board[j][i])

        for box_row in range(3):
            for box_col in range(3):
                box_nums = set()
                for i in range(3):
                    for j in range(3):
                        num = board[box_row * 3 + i][box_col * 3 + j]
                        if num != 0:
                            if num in box_nums:
                                return False
                            box_nums.add(num)
        return True

    if is_sudoku_valid(grid):
        print("valid")
    else:
        print("invalid")

solve_sudoku()
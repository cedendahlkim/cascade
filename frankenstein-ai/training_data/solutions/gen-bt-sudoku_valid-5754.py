# Task: gen-bt-sudoku_valid-5754 | Score: 100% | 2026-02-12T09:16:03.697514

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
        for block_row in range(3):
            for block_col in range(3):
                block_nums = set()
                for i in range(3):
                    for j in range(3):
                        num = board[block_row * 3 + i][block_col * 3 + j]
                        if num != 0:
                            if num in block_nums:
                                return False
                            block_nums.add(num)
        return True

    if is_sudoku_valid(grid):
        print("valid")
    else:
        print("invalid")

solve_sudoku()
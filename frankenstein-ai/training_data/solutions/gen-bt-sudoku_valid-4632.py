# Task: gen-bt-sudoku_valid-4632 | Score: 100% | 2026-02-11T14:35:39.129245

def solve_sudoku():
    grid = []
    for _ in range(9):
        grid.append(list(map(int, input().split())))

    def is_valid(board, row, col, num):
        # Check row
        for i in range(9):
            if board[row][i] == num:
                return False

        # Check column
        for i in range(9):
            if board[i][col] == num:
                return False

        # Check 3x3 box
        start_row = row - row % 3
        start_col = col - col % 3
        for i in range(3):
            for j in range(3):
                if board[start_row + i][start_col + j] == num:
                    return False

        return True

    def find_empty(board):
        for i in range(9):
            for j in range(9):
                if board[i][j] == 0:
                    return (i, j)  # row, col

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

        for box_row in range(0, 9, 3):
            for box_col in range(0, 9, 3):
                box_nums = set()
                for i in range(box_row, box_row + 3):
                    for j in range(box_col, box_col + 3):
                        if board[i][j] != 0:
                            if board[i][j] in box_nums:
                                return False
                            box_nums.add(board[i][j])
        return True
    
    if is_sudoku_valid(grid):
        print("valid")
    else:
        print("invalid")

solve_sudoku()
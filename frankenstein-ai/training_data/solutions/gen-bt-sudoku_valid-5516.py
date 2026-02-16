# Task: gen-bt-sudoku_valid-5516 | Score: 100% | 2026-02-11T13:24:12.837284

def solve_sudoku():
    grid = []
    for _ in range(9):
        grid.append(list(map(int, input().split())))

    def is_valid(grid):
        for i in range(9):
            row_values = []
            col_values = []
            for j in range(9):
                if grid[i][j] != 0:
                    if grid[i][j] in row_values:
                        return False
                    row_values.append(grid[i][j])

                if grid[j][i] != 0:
                    if grid[j][i] in col_values:
                        return False
                    col_values.append(grid[j][i])

        for i in range(0, 9, 3):
            for j in range(0, 9, 3):
                block_values = []
                for row in range(i, i + 3):
                    for col in range(j, j + 3):
                        if grid[row][col] != 0:
                            if grid[row][col] in block_values:
                                return False
                            block_values.append(grid[row][col])
        return True

    if is_valid(grid):
        print("valid")
    else:
        print("invalid")

solve_sudoku()
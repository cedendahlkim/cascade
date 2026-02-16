# Task: gen-bt-sudoku_valid-9123 | Score: 100% | 2026-02-11T12:23:35.703175

def solve_sudoku():
    grid = []
    for _ in range(9):
        grid.append(list(map(int, input().split())))

    def is_valid(grid):
        for i in range(9):
            row_values = set()
            col_values = set()
            for j in range(9):
                if grid[i][j] != 0:
                    if grid[i][j] in row_values:
                        return False
                    row_values.add(grid[i][j])
                if grid[j][i] != 0:
                    if grid[j][i] in col_values:
                        return False
                    col_values.add(grid[j][i])

        for block_row in range(3):
            for block_col in range(3):
                block_values = set()
                for i in range(3):
                    for j in range(3):
                        val = grid[block_row * 3 + i][block_col * 3 + j]
                        if val != 0:
                            if val in block_values:
                                return False
                            block_values.add(val)
        return True

    if is_valid(grid):
        print("valid")
    else:
        print("invalid")

solve_sudoku()
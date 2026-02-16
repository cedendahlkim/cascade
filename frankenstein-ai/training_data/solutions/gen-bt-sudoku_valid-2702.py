# Task: gen-bt-sudoku_valid-2702 | Score: 100% | 2026-02-12T09:27:44.666692

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
                for i in range(block_row * 3, block_row * 3 + 3):
                    for j in range(block_col * 3, block_col * 3 + 3):
                        if grid[i][j] != 0:
                            if grid[i][j] in block_values:
                                return False
                            block_values.add(grid[i][j])
        return True

    if is_valid(grid):
        print("valid")
    else:
        print("invalid")

solve_sudoku()
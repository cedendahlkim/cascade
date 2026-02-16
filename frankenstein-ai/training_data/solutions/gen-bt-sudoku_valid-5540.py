# Task: gen-bt-sudoku_valid-5540 | Score: 100% | 2026-02-11T20:43:10.385546

def solve_sudoku():
    grid = []
    for _ in range(9):
        grid.append(list(map(int, input().split())))

    def is_valid(grid):
        for i in range(9):
            row_values = [num for num in grid[i] if num != 0]
            if len(row_values) != len(set(row_values)):
                return False

            col_values = [grid[j][i] for j in range(9) if grid[j][i] != 0]
            if len(col_values) != len(set(col_values)):
                return False

        for block_row in range(3):
            for block_col in range(3):
                block_values = []
                for i in range(3):
                    for j in range(3):
                        num = grid[block_row * 3 + i][block_col * 3 + j]
                        if num != 0:
                            block_values.append(num)
                if len(block_values) != len(set(block_values)):
                    return False
        return True

    if is_valid(grid):
        print("valid")
    else:
        print("invalid")

solve_sudoku()
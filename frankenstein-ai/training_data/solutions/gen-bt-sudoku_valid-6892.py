# Task: gen-bt-sudoku_valid-6892 | Score: 100% | 2026-02-12T09:06:41.203253

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
        
        for box_row in range(3):
            for box_col in range(3):
                box_values = set()
                for i in range(box_row * 3, box_row * 3 + 3):
                    for j in range(box_col * 3, box_col * 3 + 3):
                        if grid[i][j] != 0:
                            if grid[i][j] in box_values:
                                return False
                            box_values.add(grid[i][j])
        return True

    if is_valid(grid):
        print("valid")
    else:
        print("invalid")

solve_sudoku()
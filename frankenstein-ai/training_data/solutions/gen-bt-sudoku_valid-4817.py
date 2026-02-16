# Task: gen-bt-sudoku_valid-4817 | Score: 100% | 2026-02-11T20:02:32.156007

def solve_sudoku():
    grid = []
    for _ in range(9):
        grid.append(list(map(int, input().split())))

    def is_valid(grid):
        # Check rows
        for row in grid:
            seen = set()
            for num in row:
                if num != 0:
                    if num in seen:
                        return False
                    seen.add(num)

        # Check columns
        for col in range(9):
            seen = set()
            for row in range(9):
                num = grid[row][col]
                if num != 0:
                    if num in seen:
                        return False
                    seen.add(num)

        # Check 3x3 subgrids
        for i in range(0, 9, 3):
            for j in range(0, 9, 3):
                seen = set()
                for row in range(i, i + 3):
                    for col in range(j, j + 3):
                        num = grid[row][col]
                        if num != 0:
                            if num in seen:
                                return False
                            seen.add(num)
        return True

    if is_valid(grid):
        print("valid")
    else:
        print("invalid")

solve_sudoku()
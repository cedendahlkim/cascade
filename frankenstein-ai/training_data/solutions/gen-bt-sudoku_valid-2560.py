# Task: gen-bt-sudoku_valid-2560 | Score: 100% | 2026-02-11T13:43:57.168225

def solve():
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

        # Check 3x3 boxes
        for box_row in range(3):
            for box_col in range(3):
                seen = set()
                for i in range(3):
                    for j in range(3):
                        num = grid[box_row * 3 + i][box_col * 3 + j]
                        if num != 0:
                            if num in seen:
                                return False
                            seen.add(num)
        return True

    if is_valid(grid):
        print("valid")
    else:
        print("invalid")

solve()
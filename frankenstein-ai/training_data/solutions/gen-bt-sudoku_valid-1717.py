# Task: gen-bt-sudoku_valid-1717 | Score: 100% | 2026-02-13T13:03:04.908350

grid = []
for _ in range(9):
    grid.append(list(map(int, input().split())))
valid = True
for i in range(9):
    row = [x for x in grid[i] if x != 0]
    if len(row) != len(set(row)):
        valid = False
        break
    col = [grid[r][i] for r in range(9) if grid[r][i] != 0]
    if len(col) != len(set(col)):
        valid = False
        break
if valid:
    for br in range(3):
        for bc in range(3):
            box = []
            for r in range(br*3, br*3+3):
                for c in range(bc*3, bc*3+3):
                    if grid[r][c] != 0:
                        box.append(grid[r][c])
            if len(box) != len(set(box)):
                valid = False
                break
        if not valid:
            break
print('valid' if valid else 'invalid')
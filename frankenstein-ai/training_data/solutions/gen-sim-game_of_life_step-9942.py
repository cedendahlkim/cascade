# Task: gen-sim-game_of_life_step-9942 | Score: 100% | 2026-02-15T08:36:09.286095

def solve():
    n, m = map(int, input().split())
    grid = [list(input()) for _ in range(n)]

    new_grid = [['.' for _ in range(m)] for _ in range(n)]

    for i in range(n):
        for j in range(m):
            live_neighbors = 0
            for x in range(max(0, i - 1), min(n, i + 2)):
                for y in range(max(0, j - 1), min(m, j + 2)):
                    if (x, y) != (i, j) and grid[x][y] == '#':
                        live_neighbors += 1

            if grid[i][j] == '#':
                if live_neighbors < 2 or live_neighbors > 3:
                    new_grid[i][j] = '.'
                else:
                    new_grid[i][j] = '#'
            else:
                if live_neighbors == 3:
                    new_grid[i][j] = '#'
                else:
                    new_grid[i][j] = '.'

    for row in new_grid:
        print("".join(row))

solve()
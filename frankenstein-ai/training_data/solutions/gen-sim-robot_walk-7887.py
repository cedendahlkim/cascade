# Task: gen-sim-robot_walk-7887 | Score: 100% | 2026-02-13T18:35:53.646398

n = int(input())
x, y = 0, 0
for _ in range(n):
    move = input()
    if move == 'U':
        y += 1
    elif move == 'D':
        y -= 1
    elif move == 'L':
        x -= 1
    elif move == 'R':
        x += 1
print(x, y)
print(abs(x) + abs(y))
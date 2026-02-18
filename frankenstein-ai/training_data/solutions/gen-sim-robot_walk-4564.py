# Task: gen-sim-robot_walk-4564 | Score: 100% | 2026-02-17T20:33:06.509860

n = int(input())
x = 0
y = 0
for _ in range(n):
    command = input()
    if command == 'U':
        y += 1
    elif command == 'D':
        y -= 1
    elif command == 'L':
        x -= 1
    elif command == 'R':
        x += 1
print(x, y)
print(abs(x) + abs(y))
# Task: gen-sim-robot_walk-9146 | Score: 100% | 2026-02-15T11:13:13.409410

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
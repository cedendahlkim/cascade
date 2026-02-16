# Task: gen-sim-robot_walk-7947 | Score: 100% | 2026-02-14T12:28:37.535919

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
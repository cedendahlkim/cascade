# Task: 4.2 | Score: 100% | 2026-02-13T18:31:25.955875

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

numbers.sort()
print(*numbers)
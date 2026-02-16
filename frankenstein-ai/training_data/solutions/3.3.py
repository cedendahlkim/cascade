# Task: 3.3 | Score: 100% | 2026-02-13T18:30:33.031665

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

print(min(numbers), max(numbers))
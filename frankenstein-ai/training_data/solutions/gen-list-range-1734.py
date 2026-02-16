# Task: gen-list-range-1734 | Score: 100% | 2026-02-12T14:32:34.075963

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

print(max(numbers) - min(numbers))
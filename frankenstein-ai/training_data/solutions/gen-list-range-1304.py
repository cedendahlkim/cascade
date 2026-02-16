# Task: gen-list-range-1304 | Score: 100% | 2026-02-12T20:52:29.564181

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

print(max(numbers) - min(numbers))
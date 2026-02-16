# Task: gen-list-range-4315 | Score: 100% | 2026-02-12T12:37:29.060004

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

print(max(numbers) - min(numbers))
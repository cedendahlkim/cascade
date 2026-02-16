# Task: gen-list-range-1588 | Score: 100% | 2026-02-12T18:13:29.821276

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

print(max(numbers) - min(numbers))
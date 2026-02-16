# Task: gen-list-range-3491 | Score: 100% | 2026-02-12T12:11:14.426790

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

print(max(numbers) - min(numbers))
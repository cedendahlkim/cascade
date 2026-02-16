# Task: gen-list-range-6820 | Score: 100% | 2026-02-12T17:29:36.837038

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

print(max(numbers) - min(numbers))
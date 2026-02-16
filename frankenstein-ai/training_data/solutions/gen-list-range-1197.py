# Task: gen-list-range-1197 | Score: 100% | 2026-02-12T14:14:10.094487

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

print(max(numbers) - min(numbers))
# Task: gen-list-range-7274 | Score: 100% | 2026-02-12T12:19:22.655491

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

print(max(numbers) - min(numbers))
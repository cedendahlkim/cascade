# Task: gen-list-range-4004 | Score: 100% | 2026-02-12T19:27:19.466708

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

print(max(numbers) - min(numbers))
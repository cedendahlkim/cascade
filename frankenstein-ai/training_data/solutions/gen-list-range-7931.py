# Task: gen-list-range-7931 | Score: 100% | 2026-02-10T15:40:10.726328

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

print(max(numbers) - min(numbers))
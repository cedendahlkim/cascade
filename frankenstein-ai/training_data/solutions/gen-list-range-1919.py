# Task: gen-list-range-1919 | Score: 100% | 2026-02-12T20:52:50.318786

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

print(max(numbers) - min(numbers))
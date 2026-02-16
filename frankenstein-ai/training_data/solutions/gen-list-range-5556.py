# Task: gen-list-range-5556 | Score: 100% | 2026-02-12T17:39:55.866949

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

print(max(numbers) - min(numbers))
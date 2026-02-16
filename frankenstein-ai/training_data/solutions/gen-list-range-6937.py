# Task: gen-list-range-6937 | Score: 100% | 2026-02-12T20:28:24.008974

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

print(max(numbers) - min(numbers))
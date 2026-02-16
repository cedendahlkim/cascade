# Task: gen-list-range-7745 | Score: 100% | 2026-02-12T13:22:12.730011

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

print(max(numbers) - min(numbers))
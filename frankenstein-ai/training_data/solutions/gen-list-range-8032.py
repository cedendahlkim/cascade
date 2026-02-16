# Task: gen-list-range-8032 | Score: 100% | 2026-02-12T13:13:22.925960

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

print(max(numbers) - min(numbers))
# Task: gen-list-range-1159 | Score: 100% | 2026-02-12T13:18:46.339741

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

print(max(numbers) - min(numbers))
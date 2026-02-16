# Task: gen-list-range-1567 | Score: 100% | 2026-02-12T14:18:25.232912

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

print(max(numbers) - min(numbers))
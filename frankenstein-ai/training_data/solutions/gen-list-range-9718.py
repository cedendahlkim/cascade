# Task: gen-list-range-9718 | Score: 100% | 2026-02-12T12:18:07.518885

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

print(max(numbers) - min(numbers))
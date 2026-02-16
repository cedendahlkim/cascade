# Task: gen-list-range-4385 | Score: 100% | 2026-02-12T18:10:19.293709

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

print(max(numbers) - min(numbers))
# Task: gen-list-range-2687 | Score: 100% | 2026-02-12T18:11:42.563614

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

print(max(numbers) - min(numbers))
# Task: gen-list-range-4598 | Score: 100% | 2026-02-12T20:27:17.156974

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

print(max(numbers) - min(numbers))
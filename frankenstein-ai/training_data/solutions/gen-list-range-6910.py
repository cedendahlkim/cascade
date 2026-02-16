# Task: gen-list-range-6910 | Score: 100% | 2026-02-12T12:41:26.157732

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

print(max(numbers) - min(numbers))
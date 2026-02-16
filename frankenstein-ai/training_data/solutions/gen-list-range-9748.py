# Task: gen-list-range-9748 | Score: 100% | 2026-02-12T13:12:51.602189

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

print(max(numbers) - min(numbers))
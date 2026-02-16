# Task: gen-list-range-6975 | Score: 100% | 2026-02-12T13:23:00.255197

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

print(max(numbers) - min(numbers))
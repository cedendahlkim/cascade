# Task: gen-list-range-7835 | Score: 100% | 2026-02-12T14:13:27.089722

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

print(max(numbers) - min(numbers))
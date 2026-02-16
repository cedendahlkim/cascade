# Task: gen-list-range-6844 | Score: 100% | 2026-02-10T15:40:07.039457

n = int(input())
numbers = []
for _ in range(n):
  numbers.append(int(input()))

print(max(numbers) - min(numbers))
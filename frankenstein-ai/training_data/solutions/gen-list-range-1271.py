# Task: gen-list-range-1271 | Score: 100% | 2026-02-12T12:13:32.566545

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

print(max(numbers) - min(numbers))
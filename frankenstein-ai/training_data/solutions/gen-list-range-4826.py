# Task: gen-list-range-4826 | Score: 100% | 2026-02-12T12:20:49.688786

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

print(max(numbers) - min(numbers))
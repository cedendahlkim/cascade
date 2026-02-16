# Task: gen-list-range-8231 | Score: 100% | 2026-02-12T12:20:58.796831

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

print(max(numbers) - min(numbers))
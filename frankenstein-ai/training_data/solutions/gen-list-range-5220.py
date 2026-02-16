# Task: gen-list-range-5220 | Score: 100% | 2026-02-12T18:50:25.912891

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

print(max(numbers) - min(numbers))
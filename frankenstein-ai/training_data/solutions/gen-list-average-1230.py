# Task: gen-list-average-1230 | Score: 100% | 2026-02-13T09:04:33.147363

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

average = round(sum(numbers) / n)
print(average)
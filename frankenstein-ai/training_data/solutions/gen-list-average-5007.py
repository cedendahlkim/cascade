# Task: gen-list-average-5007 | Score: 100% | 2026-02-10T15:40:57.079464

n = int(input())
numbers = []
for _ in range(n):
  numbers.append(int(input()))

average = round(sum(numbers) / n)
print(average)
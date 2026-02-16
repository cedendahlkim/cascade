# Task: gen-list-average-4618 | Score: 100% | 2026-02-12T13:19:18.879573

n = int(input())
sum = 0
for i in range(n):
  num = int(input())
  sum += num

print(round(sum / n))
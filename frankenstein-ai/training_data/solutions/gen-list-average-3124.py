# Task: gen-list-average-3124 | Score: 100% | 2026-02-12T13:18:34.165621

n = int(input())
sum_numbers = 0
for _ in range(n):
    num = int(input())
    sum_numbers += num
average = round(sum_numbers / n)
print(average)
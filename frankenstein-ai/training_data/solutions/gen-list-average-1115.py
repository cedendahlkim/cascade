# Task: gen-list-average-1115 | Score: 100% | 2026-02-12T17:30:20.690845

n = int(input())
sum_numbers = 0
for _ in range(n):
    num = int(input())
    sum_numbers += num

average = round(sum_numbers / n)
print(average)
# Task: gen-list-average-8620 | Score: 100% | 2026-02-12T18:10:36.055196

n = int(input())
sum_numbers = 0
for _ in range(n):
    num = int(input())
    sum_numbers += num

average = round(sum_numbers / n)
print(average)
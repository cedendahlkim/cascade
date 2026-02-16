# Task: gen-list-average-5097 | Score: 100% | 2026-02-12T14:17:59.144739

n = int(input())
sum_numbers = 0
for _ in range(n):
    num = int(input())
    sum_numbers += num

average = round(sum_numbers / n)
print(average)
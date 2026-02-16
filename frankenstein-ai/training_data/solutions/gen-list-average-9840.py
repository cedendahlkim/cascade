# Task: gen-list-average-9840 | Score: 100% | 2026-02-12T18:50:45.589631

n = int(input())
sum_numbers = 0
for _ in range(n):
    num = int(input())
    sum_numbers += num

average = round(sum_numbers / n)
print(average)
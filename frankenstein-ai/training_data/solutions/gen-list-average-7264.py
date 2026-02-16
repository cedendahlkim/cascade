# Task: gen-list-average-7264 | Score: 100% | 2026-02-12T19:27:34.478411

n = int(input())
sum_numbers = 0
for _ in range(n):
    num = int(input())
    sum_numbers += num

average = round(sum_numbers / n)
print(average)
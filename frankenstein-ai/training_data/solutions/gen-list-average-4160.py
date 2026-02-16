# Task: gen-list-average-4160 | Score: 100% | 2026-02-12T12:13:26.790134

n = int(input())
sum_numbers = 0
for _ in range(n):
    num = int(input())
    sum_numbers += num

average = round(sum_numbers / n)
print(average)
# Task: gen-list-average-8626 | Score: 100% | 2026-02-12T18:50:10.656366

n = int(input())
sum_numbers = 0
for _ in range(n):
    num = int(input())
    sum_numbers += num

average = round(sum_numbers / n)
print(average)
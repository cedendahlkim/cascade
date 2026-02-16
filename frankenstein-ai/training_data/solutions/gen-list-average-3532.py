# Task: gen-list-average-3532 | Score: 100% | 2026-02-12T12:27:47.577004

n = int(input())
sum_numbers = 0
for _ in range(n):
    num = int(input())
    sum_numbers += num
print(round(sum_numbers / n))
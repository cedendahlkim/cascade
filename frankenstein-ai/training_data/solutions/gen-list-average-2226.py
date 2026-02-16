# Task: gen-list-average-2226 | Score: 100% | 2026-02-12T12:27:47.316948

n = int(input())
sum_numbers = 0
for _ in range(n):
    num = int(input())
    sum_numbers += num
print(round(sum_numbers / n))
# Task: gen-list-average-9576 | Score: 100% | 2026-02-12T20:27:44.833143

n = int(input())
sum_numbers = 0
for _ in range(n):
    num = int(input())
    sum_numbers += num

average = round(sum_numbers / n)
print(average)
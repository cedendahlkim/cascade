# Task: gen-list-average-7912 | Score: 100% | 2026-02-12T19:13:05.394665

n = int(input())
sum = 0
for i in range(n):
    num = int(input())
    sum += num
print(round(sum / n))
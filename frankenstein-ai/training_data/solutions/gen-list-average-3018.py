# Task: gen-list-average-3018 | Score: 100% | 2026-02-12T17:31:32.585158

n = int(input())
sum = 0
for i in range(n):
    num = int(input())
    sum += num
print(round(sum / n))
# Task: gen-list-average-7914 | Score: 100% | 2026-02-12T19:12:55.689127

n = int(input())
sum = 0
for i in range(n):
    num = int(input())
    sum += num
print(round(sum / n))
# Task: gen-list-average-4677 | Score: 100% | 2026-02-12T18:11:52.588158

n = int(input())
sum = 0
for i in range(n):
    num = int(input())
    sum += num
print(round(sum / n))
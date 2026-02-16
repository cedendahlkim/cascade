# Task: gen-list-average-2664 | Score: 100% | 2026-02-12T18:11:52.313074

n = int(input())
sum = 0
for i in range(n):
    num = int(input())
    sum += num
print(round(sum / n))
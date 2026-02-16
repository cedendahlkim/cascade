# Task: gen-list-average-9483 | Score: 100% | 2026-02-12T12:31:53.356480

n = int(input())
sum = 0
for i in range(n):
    num = int(input())
    sum += num

avg = round(sum / n)
print(avg)
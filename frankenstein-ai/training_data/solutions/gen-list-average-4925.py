# Task: gen-list-average-4925 | Score: 100% | 2026-02-12T12:31:56.447439

n = int(input())
sum = 0
for i in range(n):
    num = int(input())
    sum += num

avg = round(sum / n)
print(avg)
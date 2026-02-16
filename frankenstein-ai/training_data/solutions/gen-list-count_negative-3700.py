# Task: gen-list-count_negative-3700 | Score: 100% | 2026-02-12T17:30:31.617034

n = int(input())
count = 0
for _ in range(n):
    num = int(input())
    if num < 0:
        count += 1
print(count)
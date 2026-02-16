# Task: gen-list-count_positive-2602 | Score: 100% | 2026-02-12T12:24:35.219835

n = int(input())
count = 0
for _ in range(n):
    num = int(input())
    if num > 0:
        count += 1
print(count)
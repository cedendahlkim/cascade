# Task: gen-list-count_positive-3531 | Score: 100% | 2026-02-10T15:41:07.149684

n = int(input())
count = 0
for _ in range(n):
    num = int(input())
    if num > 0:
        count += 1
print(count)
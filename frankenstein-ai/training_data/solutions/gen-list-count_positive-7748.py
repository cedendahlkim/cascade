# Task: gen-list-count_positive-7748 | Score: 100% | 2026-02-10T15:40:31.349331

n = int(input())
count = 0
for i in range(n):
    num = int(input())
    if num > 0:
        count += 1
print(count)
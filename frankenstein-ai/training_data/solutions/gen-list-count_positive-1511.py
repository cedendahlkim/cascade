# Task: gen-list-count_positive-1511 | Score: 100% | 2026-02-12T19:26:56.035600

n = int(input())
count = 0
for _ in range(n):
    num = int(input())
    if num > 0:
        count += 1
print(count)
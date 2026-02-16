# Task: gen-list-count_positive-3851 | Score: 100% | 2026-02-12T12:13:59.505917

n = int(input())
count = 0
for _ in range(n):
    num = int(input())
    if num > 0:
        count += 1
print(count)
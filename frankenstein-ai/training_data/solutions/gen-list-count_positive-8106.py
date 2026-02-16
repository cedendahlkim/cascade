# Task: gen-list-count_positive-8106 | Score: 100% | 2026-02-12T18:50:31.575763

n = int(input())
count = 0
for _ in range(n):
    num = int(input())
    if num > 0:
        count += 1
print(count)
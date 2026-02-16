# Task: gen-list-count_positive-5196 | Score: 100% | 2026-02-12T17:30:51.440189

n = int(input())
count = 0
for _ in range(n):
    num = int(input())
    if num > 0:
        count += 1
print(count)
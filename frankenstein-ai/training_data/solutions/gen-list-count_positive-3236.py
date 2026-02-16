# Task: gen-list-count_positive-3236 | Score: 100% | 2026-02-12T17:29:06.606303

n = int(input())
count = 0
for _ in range(n):
    num = int(input())
    if num > 0:
        count += 1
print(count)
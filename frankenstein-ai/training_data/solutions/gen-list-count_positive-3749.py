# Task: gen-list-count_positive-3749 | Score: 100% | 2026-02-12T12:44:41.586728

n = int(input())
count = 0
for _ in range(n):
    num = int(input())
    if num > 0:
        count += 1
print(count)
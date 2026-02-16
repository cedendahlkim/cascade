# Task: gen-list-count_positive-7637 | Score: 100% | 2026-02-12T13:13:01.999296

n = int(input())
count = 0
for _ in range(n):
    num = int(input())
    if num > 0:
        count += 1
print(count)
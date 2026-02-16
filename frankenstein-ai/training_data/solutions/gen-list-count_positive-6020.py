# Task: gen-list-count_positive-6020 | Score: 100% | 2026-02-12T18:14:14.880996

n = int(input())
count = 0
for _ in range(n):
    num = int(input())
    if num > 0:
        count += 1
print(count)
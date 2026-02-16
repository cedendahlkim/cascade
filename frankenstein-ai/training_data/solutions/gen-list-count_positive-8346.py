# Task: gen-list-count_positive-8346 | Score: 100% | 2026-02-12T14:32:25.059628

n = int(input())
count = 0
for _ in range(n):
    num = int(input())
    if num > 0:
        count += 1
print(count)
# Task: gen-list-count_positive-5912 | Score: 100% | 2026-02-12T12:31:44.345882

n = int(input())
count = 0
for _ in range(n):
    num = int(input())
    if num > 0:
        count += 1
print(count)
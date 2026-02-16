# Task: gen-list-count_negative-3831 | Score: 100% | 2026-02-12T17:28:01.485671

n = int(input())
count = 0
for _ in range(n):
    num = int(input())
    if num < 0:
        count += 1
print(count)
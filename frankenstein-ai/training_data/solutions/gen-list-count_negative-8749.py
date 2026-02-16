# Task: gen-list-count_negative-8749 | Score: 100% | 2026-02-12T20:52:39.905350

n = int(input())
count = 0
for _ in range(n):
    num = int(input())
    if num < 0:
        count += 1
print(count)
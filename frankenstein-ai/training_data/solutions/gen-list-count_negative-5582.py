# Task: gen-list-count_negative-5582 | Score: 100% | 2026-02-10T15:40:52.969568

n = int(input())
count = 0
for _ in range(n):
    num = int(input())
    if num < 0:
        count += 1
print(count)
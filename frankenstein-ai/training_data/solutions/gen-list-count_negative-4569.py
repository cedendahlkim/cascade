# Task: gen-list-count_negative-4569 | Score: 100% | 2026-02-12T12:48:24.204232

n = int(input())
count = 0
for _ in range(n):
    num = int(input())
    if num < 0:
        count += 1
print(count)
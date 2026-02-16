# Task: gen-list-count_negative-2016 | Score: 100% | 2026-02-12T14:16:56.462273

n = int(input())
count = 0
for _ in range(n):
    num = int(input())
    if num < 0:
        count += 1
print(count)
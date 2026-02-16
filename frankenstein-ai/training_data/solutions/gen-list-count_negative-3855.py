# Task: gen-list-count_negative-3855 | Score: 100% | 2026-02-12T12:24:38.304511

n = int(input())
count = 0
for _ in range(n):
    num = int(input())
    if num < 0:
        count += 1
print(count)
# Task: gen-list-count_negative-5963 | Score: 100% | 2026-02-13T09:04:13.548522

n = int(input())
count = 0
for _ in range(n):
    num = int(input())
    if num < 0:
        count += 1
print(count)
# Task: gen-list-count_negative-7031 | Score: 100% | 2026-02-10T15:40:50.255474

n = int(input())
count = 0
for _ in range(n):
    num = int(input())
    if num < 0:
        count += 1
print(count)
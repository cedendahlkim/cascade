# Task: gen-list-count_negative-9962 | Score: 100% | 2026-02-14T12:20:51.004365

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))
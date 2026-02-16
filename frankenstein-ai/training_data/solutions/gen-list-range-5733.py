# Task: gen-list-range-5733 | Score: 100% | 2026-02-13T20:49:41.991820

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
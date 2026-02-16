# Task: gen-list-range-7664 | Score: 100% | 2026-02-15T09:02:36.635228

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
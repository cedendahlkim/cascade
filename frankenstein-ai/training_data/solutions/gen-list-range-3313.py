# Task: gen-list-range-3313 | Score: 100% | 2026-02-15T09:51:28.261057

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
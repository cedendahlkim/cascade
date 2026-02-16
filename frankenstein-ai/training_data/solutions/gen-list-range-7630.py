# Task: gen-list-range-7630 | Score: 100% | 2026-02-15T07:52:35.870857

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
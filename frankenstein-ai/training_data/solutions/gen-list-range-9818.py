# Task: gen-list-range-9818 | Score: 100% | 2026-02-14T12:08:54.331429

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
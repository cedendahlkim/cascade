# Task: gen-list-range-3460 | Score: 100% | 2026-02-13T16:07:09.983785

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
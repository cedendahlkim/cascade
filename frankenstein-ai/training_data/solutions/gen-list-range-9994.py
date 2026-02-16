# Task: gen-list-range-9994 | Score: 100% | 2026-02-13T16:48:13.705071

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
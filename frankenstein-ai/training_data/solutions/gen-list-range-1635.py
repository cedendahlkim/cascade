# Task: gen-list-range-1635 | Score: 100% | 2026-02-15T09:51:42.987520

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
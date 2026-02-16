# Task: gen-list-range-6945 | Score: 100% | 2026-02-15T09:51:41.755345

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
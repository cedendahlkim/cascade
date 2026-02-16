# Task: gen-list-range-9448 | Score: 100% | 2026-02-15T09:16:39.880328

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
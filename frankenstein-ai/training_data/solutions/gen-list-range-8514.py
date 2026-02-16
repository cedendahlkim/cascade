# Task: gen-list-range-8514 | Score: 100% | 2026-02-15T13:00:34.548294

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
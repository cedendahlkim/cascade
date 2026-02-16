# Task: gen-list-range-4796 | Score: 100% | 2026-02-15T09:16:37.624249

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
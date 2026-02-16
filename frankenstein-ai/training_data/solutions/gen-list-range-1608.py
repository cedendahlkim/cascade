# Task: gen-list-range-1608 | Score: 100% | 2026-02-15T11:13:43.379006

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
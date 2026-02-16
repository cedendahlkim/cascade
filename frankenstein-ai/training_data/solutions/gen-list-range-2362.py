# Task: gen-list-range-2362 | Score: 100% | 2026-02-13T11:34:34.427713

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
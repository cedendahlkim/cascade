# Task: gen-list-range-6415 | Score: 100% | 2026-02-13T09:34:36.737350

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
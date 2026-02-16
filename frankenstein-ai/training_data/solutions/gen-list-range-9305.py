# Task: gen-list-range-9305 | Score: 100% | 2026-02-13T14:01:18.525061

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
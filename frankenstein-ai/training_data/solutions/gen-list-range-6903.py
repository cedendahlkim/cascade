# Task: gen-list-range-6903 | Score: 100% | 2026-02-13T14:01:34.617519

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
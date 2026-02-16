# Task: gen-list-range-6989 | Score: 100% | 2026-02-13T09:15:54.769716

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
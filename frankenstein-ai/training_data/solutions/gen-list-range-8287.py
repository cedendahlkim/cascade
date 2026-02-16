# Task: gen-list-range-8287 | Score: 100% | 2026-02-13T20:50:40.732806

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
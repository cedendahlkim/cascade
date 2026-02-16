# Task: gen-list-range-8189 | Score: 100% | 2026-02-13T13:42:57.373190

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
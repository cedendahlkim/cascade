# Task: gen-list-range-6951 | Score: 100% | 2026-02-13T13:47:54.189666

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
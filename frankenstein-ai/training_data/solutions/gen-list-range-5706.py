# Task: gen-list-range-5706 | Score: 100% | 2026-02-13T10:01:44.060892

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
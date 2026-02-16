# Task: gen-list-range-5864 | Score: 100% | 2026-02-13T18:30:02.308003

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
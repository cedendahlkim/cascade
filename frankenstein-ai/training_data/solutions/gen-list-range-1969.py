# Task: gen-list-range-1969 | Score: 100% | 2026-02-13T18:39:57.507719

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
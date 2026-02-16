# Task: gen-list-range-1246 | Score: 100% | 2026-02-13T10:01:46.379276

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
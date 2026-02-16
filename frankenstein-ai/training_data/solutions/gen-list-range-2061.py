# Task: gen-list-range-2061 | Score: 100% | 2026-02-13T09:15:56.771305

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
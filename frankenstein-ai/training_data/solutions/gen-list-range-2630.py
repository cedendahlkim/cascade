# Task: gen-list-range-2630 | Score: 100% | 2026-02-13T14:01:19.058829

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
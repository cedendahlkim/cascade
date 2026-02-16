# Task: gen-list-range-2623 | Score: 100% | 2026-02-14T12:37:42.409496

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
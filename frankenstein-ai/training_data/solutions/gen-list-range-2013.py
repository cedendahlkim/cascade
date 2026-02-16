# Task: gen-list-range-2013 | Score: 100% | 2026-02-14T13:11:14.033939

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
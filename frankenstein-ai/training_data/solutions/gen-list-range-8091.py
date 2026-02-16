# Task: gen-list-range-8091 | Score: 100% | 2026-02-15T09:51:20.782664

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
# Task: gen-list-range-8556 | Score: 100% | 2026-02-15T07:53:39.111598

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
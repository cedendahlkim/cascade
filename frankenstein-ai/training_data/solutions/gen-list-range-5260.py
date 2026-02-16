# Task: gen-list-range-5260 | Score: 100% | 2026-02-14T12:04:51.158801

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
# Task: gen-list-range-5240 | Score: 100% | 2026-02-17T20:12:46.837201

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
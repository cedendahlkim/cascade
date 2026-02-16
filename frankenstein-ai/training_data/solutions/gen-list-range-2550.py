# Task: gen-list-range-2550 | Score: 100% | 2026-02-13T11:09:03.246534

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
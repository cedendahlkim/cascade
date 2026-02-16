# Task: gen-list-range-6751 | Score: 100% | 2026-02-13T11:35:29.226606

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
# Task: gen-list-range-2340 | Score: 100% | 2026-02-13T16:47:46.437652

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
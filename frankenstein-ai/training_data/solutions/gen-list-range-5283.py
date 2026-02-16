# Task: gen-list-range-5283 | Score: 100% | 2026-02-13T14:42:17.421486

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
# Task: gen-list-range-4043 | Score: 100% | 2026-02-13T18:37:52.064528

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
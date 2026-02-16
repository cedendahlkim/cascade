# Task: gen-list-range-2410 | Score: 100% | 2026-02-13T15:28:08.662734

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
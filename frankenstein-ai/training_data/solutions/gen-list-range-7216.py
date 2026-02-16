# Task: gen-list-range-7216 | Score: 100% | 2026-02-13T16:07:07.380080

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
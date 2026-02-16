# Task: gen-list-range-2369 | Score: 100% | 2026-02-13T18:39:52.969396

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
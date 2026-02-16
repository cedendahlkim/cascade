# Task: gen-list-range-6440 | Score: 100% | 2026-02-13T18:33:57.699244

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
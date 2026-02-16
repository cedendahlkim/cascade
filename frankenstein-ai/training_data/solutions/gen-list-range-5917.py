# Task: gen-list-range-5917 | Score: 100% | 2026-02-13T18:36:07.965260

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
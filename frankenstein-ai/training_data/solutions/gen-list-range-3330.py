# Task: gen-list-range-3330 | Score: 100% | 2026-02-13T18:30:03.136109

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
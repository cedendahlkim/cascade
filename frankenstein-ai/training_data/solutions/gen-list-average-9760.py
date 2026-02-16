# Task: gen-list-average-9760 | Score: 100% | 2026-02-13T17:36:12.070282

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
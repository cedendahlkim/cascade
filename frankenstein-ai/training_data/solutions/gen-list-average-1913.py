# Task: gen-list-average-1913 | Score: 100% | 2026-02-15T09:16:36.330409

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
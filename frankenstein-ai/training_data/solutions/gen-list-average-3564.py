# Task: gen-list-average-3564 | Score: 100% | 2026-02-15T13:00:21.548897

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
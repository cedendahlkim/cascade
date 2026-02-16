# Task: gen-list-average-3010 | Score: 100% | 2026-02-15T08:36:06.539271

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
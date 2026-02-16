# Task: gen-list-average-2880 | Score: 100% | 2026-02-15T08:14:49.973350

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
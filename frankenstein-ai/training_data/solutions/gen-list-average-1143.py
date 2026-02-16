# Task: gen-list-average-1143 | Score: 100% | 2026-02-15T12:03:50.569898

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
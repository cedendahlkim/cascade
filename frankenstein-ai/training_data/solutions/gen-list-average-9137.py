# Task: gen-list-average-9137 | Score: 100% | 2026-02-13T17:11:29.862053

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
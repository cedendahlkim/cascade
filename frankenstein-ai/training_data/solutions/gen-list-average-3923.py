# Task: gen-list-average-3923 | Score: 100% | 2026-02-13T20:50:39.205150

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
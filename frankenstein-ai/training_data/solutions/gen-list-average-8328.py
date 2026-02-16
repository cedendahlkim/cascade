# Task: gen-list-average-8328 | Score: 100% | 2026-02-13T20:17:11.411526

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
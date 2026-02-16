# Task: gen-list-average-7542 | Score: 100% | 2026-02-13T13:42:29.649245

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
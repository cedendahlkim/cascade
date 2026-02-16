# Task: gen-list-average-2887 | Score: 100% | 2026-02-13T11:09:02.926313

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
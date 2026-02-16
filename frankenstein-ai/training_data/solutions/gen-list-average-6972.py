# Task: gen-list-average-6972 | Score: 100% | 2026-02-15T12:03:44.186996

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
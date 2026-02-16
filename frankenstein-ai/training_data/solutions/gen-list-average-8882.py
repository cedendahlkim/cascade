# Task: gen-list-average-8882 | Score: 100% | 2026-02-14T13:12:27.594997

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
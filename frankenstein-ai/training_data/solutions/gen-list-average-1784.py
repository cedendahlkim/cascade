# Task: gen-list-average-1784 | Score: 100% | 2026-02-15T11:13:41.485150

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
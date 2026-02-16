# Task: gen-list-average-7112 | Score: 100% | 2026-02-13T09:43:27.702508

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
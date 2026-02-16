# Task: gen-list-average-8487 | Score: 100% | 2026-02-14T12:04:50.302267

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
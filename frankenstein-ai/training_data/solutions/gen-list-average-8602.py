# Task: gen-list-average-8602 | Score: 100% | 2026-02-14T12:14:11.531835

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
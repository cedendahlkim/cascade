# Task: gen-list-average-9573 | Score: 100% | 2026-02-15T12:03:53.510264

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
# Task: gen-list-average-5433 | Score: 100% | 2026-02-13T12:23:20.176453

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
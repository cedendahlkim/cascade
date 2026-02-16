# Task: gen-list-average-2460 | Score: 100% | 2026-02-13T14:18:45.535091

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
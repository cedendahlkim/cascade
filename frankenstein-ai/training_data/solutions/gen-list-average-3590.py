# Task: gen-list-average-3590 | Score: 100% | 2026-02-13T18:36:06.005824

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
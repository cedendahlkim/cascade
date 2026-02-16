# Task: gen-list-average-8917 | Score: 100% | 2026-02-13T20:33:07.036002

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
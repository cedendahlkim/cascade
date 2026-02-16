# Task: gen-list-average-7834 | Score: 100% | 2026-02-13T19:48:13.961684

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
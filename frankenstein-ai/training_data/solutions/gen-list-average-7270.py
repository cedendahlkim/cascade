# Task: gen-list-average-7270 | Score: 100% | 2026-02-13T12:25:55.091188

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
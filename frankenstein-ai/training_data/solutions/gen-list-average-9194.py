# Task: gen-list-average-9194 | Score: 100% | 2026-02-14T12:04:49.728336

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
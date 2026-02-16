# Task: gen-list-average-9286 | Score: 100% | 2026-02-15T09:01:54.716810

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
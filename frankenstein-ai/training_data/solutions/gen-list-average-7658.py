# Task: gen-list-average-7658 | Score: 100% | 2026-02-15T09:01:53.524234

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
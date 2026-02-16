# Task: gen-list-average-9484 | Score: 100% | 2026-02-15T09:16:38.991901

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
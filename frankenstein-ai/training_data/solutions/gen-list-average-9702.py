# Task: gen-list-average-9702 | Score: 100% | 2026-02-13T11:35:26.498514

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
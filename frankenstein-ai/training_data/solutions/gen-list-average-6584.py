# Task: gen-list-average-6584 | Score: 100% | 2026-02-13T13:42:07.302694

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
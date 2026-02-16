# Task: gen-list-average-8686 | Score: 100% | 2026-02-13T11:35:27.647655

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
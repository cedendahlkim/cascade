# Task: gen-list-average-7187 | Score: 100% | 2026-02-13T18:30:02.714461

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
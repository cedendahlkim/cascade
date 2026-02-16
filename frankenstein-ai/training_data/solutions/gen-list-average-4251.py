# Task: gen-list-average-4251 | Score: 100% | 2026-02-13T18:46:03.009980

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
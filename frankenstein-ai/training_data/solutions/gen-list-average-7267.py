# Task: gen-list-average-7267 | Score: 100% | 2026-02-13T13:42:05.609734

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
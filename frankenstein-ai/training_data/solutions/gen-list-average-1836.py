# Task: gen-list-average-1836 | Score: 100% | 2026-02-15T09:02:08.292739

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
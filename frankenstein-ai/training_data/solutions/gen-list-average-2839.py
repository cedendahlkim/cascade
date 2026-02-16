# Task: gen-list-average-2839 | Score: 100% | 2026-02-13T10:01:53.698838

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
# Task: gen-list-average-1785 | Score: 100% | 2026-02-13T17:36:10.488123

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
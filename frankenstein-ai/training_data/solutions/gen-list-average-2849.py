# Task: gen-list-average-2849 | Score: 100% | 2026-02-13T21:27:47.994732

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
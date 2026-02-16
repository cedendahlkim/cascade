# Task: gen-list-average-2144 | Score: 100% | 2026-02-13T09:34:37.152616

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
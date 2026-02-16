# Task: gen-list-average-7162 | Score: 100% | 2026-02-15T07:58:51.006910

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
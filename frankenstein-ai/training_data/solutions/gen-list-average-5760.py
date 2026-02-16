# Task: gen-list-average-5760 | Score: 100% | 2026-02-13T18:58:00.892074

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
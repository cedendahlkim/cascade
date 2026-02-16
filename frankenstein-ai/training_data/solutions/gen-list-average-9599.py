# Task: gen-list-average-9599 | Score: 100% | 2026-02-13T18:36:06.795449

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
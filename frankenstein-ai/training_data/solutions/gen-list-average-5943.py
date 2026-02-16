# Task: gen-list-average-5943 | Score: 100% | 2026-02-13T18:36:08.380463

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
# Task: gen-list-average-5916 | Score: 100% | 2026-02-13T18:58:10.259843

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
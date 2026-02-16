# Task: gen-list-average-8143 | Score: 100% | 2026-02-13T18:36:10.784807

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
# Task: gen-list-average-9946 | Score: 100% | 2026-02-13T18:58:03.173953

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
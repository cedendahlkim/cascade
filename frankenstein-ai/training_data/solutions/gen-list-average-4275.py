# Task: gen-list-average-4275 | Score: 100% | 2026-02-14T13:11:14.294059

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
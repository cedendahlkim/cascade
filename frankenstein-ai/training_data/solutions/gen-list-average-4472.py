# Task: gen-list-average-4472 | Score: 100% | 2026-02-13T10:01:51.663022

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
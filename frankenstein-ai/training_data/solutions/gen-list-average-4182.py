# Task: gen-list-average-4182 | Score: 100% | 2026-02-13T19:35:30.300312

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
# Task: gen-list-average-2574 | Score: 100% | 2026-02-14T12:04:50.877080

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
# Task: gen-list-average-7236 | Score: 100% | 2026-02-15T07:53:55.672046

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
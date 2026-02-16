# Task: gen-list-average-8388 | Score: 100% | 2026-02-15T08:05:49.172520

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
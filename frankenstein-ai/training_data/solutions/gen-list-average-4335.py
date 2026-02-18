# Task: gen-list-average-4335 | Score: 100% | 2026-02-17T20:12:47.425209

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
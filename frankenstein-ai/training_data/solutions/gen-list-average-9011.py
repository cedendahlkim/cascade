# Task: gen-list-average-9011 | Score: 100% | 2026-02-15T08:05:59.025184

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
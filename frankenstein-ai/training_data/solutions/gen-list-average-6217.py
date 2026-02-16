# Task: gen-list-average-6217 | Score: 100% | 2026-02-15T09:02:37.840004

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
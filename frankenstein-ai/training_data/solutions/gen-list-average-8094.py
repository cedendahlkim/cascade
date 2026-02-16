# Task: gen-list-average-8094 | Score: 100% | 2026-02-15T09:01:51.406204

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
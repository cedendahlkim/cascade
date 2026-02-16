# Task: gen-list-average-6036 | Score: 100% | 2026-02-15T07:52:34.748321

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
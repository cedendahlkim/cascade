# Task: gen-list-average-4267 | Score: 100% | 2026-02-13T20:32:59.561137

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
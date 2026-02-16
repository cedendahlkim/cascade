# Task: gen-list-average-2584 | Score: 100% | 2026-02-15T07:53:37.806193

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
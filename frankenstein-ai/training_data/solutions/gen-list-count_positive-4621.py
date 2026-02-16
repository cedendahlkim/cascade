# Task: gen-list-count_positive-4621 | Score: 100% | 2026-02-15T07:53:51.165927

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))
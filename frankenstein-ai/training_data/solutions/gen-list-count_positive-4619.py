# Task: gen-list-count_positive-4619 | Score: 100% | 2026-02-14T12:37:25.802805

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))
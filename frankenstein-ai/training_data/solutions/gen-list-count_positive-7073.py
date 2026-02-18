# Task: gen-list-count_positive-7073 | Score: 100% | 2026-02-17T20:12:49.088658

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))
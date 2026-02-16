# Task: gen-list-count_positive-8285 | Score: 100% | 2026-02-15T08:14:57.951581

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))
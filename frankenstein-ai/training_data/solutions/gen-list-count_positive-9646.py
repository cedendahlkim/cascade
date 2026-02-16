# Task: gen-list-count_positive-9646 | Score: 100% | 2026-02-13T21:27:49.172911

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))
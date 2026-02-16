# Task: gen-list-count_positive-6015 | Score: 100% | 2026-02-15T09:34:51.282588

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))
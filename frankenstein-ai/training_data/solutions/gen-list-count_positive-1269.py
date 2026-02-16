# Task: gen-list-count_positive-1269 | Score: 100% | 2026-02-15T13:01:15.290868

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))
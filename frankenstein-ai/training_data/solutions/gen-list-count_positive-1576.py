# Task: gen-list-count_positive-1576 | Score: 100% | 2026-02-13T09:42:30.126960

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))
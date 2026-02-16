# Task: gen-list-count_positive-4748 | Score: 100% | 2026-02-13T15:28:49.143886

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))
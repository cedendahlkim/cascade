# Task: gen-list-count_positive-3615 | Score: 100% | 2026-02-13T17:36:12.449443

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))
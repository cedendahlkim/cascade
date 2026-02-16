# Task: gen-list-count_positive-7488 | Score: 100% | 2026-02-13T13:47:54.654711

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))
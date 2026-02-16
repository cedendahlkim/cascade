# Task: gen-list-count_positive-5356 | Score: 100% | 2026-02-13T09:33:22.028467

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))
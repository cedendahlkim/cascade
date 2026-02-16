# Task: gen-list-count_positive-3248 | Score: 100% | 2026-02-13T14:18:57.984346

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))
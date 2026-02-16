# Task: gen-list-count_positive-6246 | Score: 100% | 2026-02-13T16:47:47.449743

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))
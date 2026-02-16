# Task: gen-list-count_positive-5302 | Score: 100% | 2026-02-13T19:48:14.278287

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))
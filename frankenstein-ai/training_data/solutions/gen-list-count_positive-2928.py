# Task: gen-list-count_positive-2928 | Score: 100% | 2026-02-13T20:17:14.201444

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))
# Task: gen-list-count_positive-6211 | Score: 100% | 2026-02-13T18:01:19.066833

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))
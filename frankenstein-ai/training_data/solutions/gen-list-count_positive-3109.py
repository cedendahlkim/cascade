# Task: gen-list-count_positive-3109 | Score: 100% | 2026-02-17T20:11:55.719122

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))
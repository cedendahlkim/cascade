# Task: gen-list-count_negative-3222 | Score: 100% | 2026-02-17T20:35:41.480650

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))
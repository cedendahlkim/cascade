# Task: gen-list-count_positive-2735 | Score: 100% | 2026-02-13T19:35:30.041511

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))
# Task: gen-list-count_negative-1094 | Score: 100% | 2026-02-17T20:35:43.220437

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))
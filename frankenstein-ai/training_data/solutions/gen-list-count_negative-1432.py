# Task: gen-list-count_negative-1432 | Score: 100% | 2026-02-13T13:42:26.653153

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))
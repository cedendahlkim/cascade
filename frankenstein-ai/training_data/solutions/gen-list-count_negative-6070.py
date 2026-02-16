# Task: gen-list-count_negative-6070 | Score: 100% | 2026-02-15T10:09:37.369820

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))
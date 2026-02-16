# Task: gen-list-count_negative-2573 | Score: 100% | 2026-02-14T13:12:26.069541

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))
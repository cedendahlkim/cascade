# Task: gen-list-count_negative-1782 | Score: 100% | 2026-02-14T12:02:57.845365

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))
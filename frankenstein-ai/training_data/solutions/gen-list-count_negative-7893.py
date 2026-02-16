# Task: gen-list-count_negative-7893 | Score: 100% | 2026-02-13T20:49:40.965418

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))
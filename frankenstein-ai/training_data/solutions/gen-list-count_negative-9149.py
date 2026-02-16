# Task: gen-list-count_negative-9149 | Score: 100% | 2026-02-13T20:50:41.108471

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))
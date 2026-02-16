# Task: gen-list-count_negative-1476 | Score: 100% | 2026-02-13T13:09:36.142197

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))
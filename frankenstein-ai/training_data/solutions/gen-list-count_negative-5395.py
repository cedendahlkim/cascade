# Task: gen-list-count_negative-5395 | Score: 100% | 2026-02-13T20:17:13.554314

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))
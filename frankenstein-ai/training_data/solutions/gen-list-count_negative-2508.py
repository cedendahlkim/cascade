# Task: gen-list-count_negative-2508 | Score: 100% | 2026-02-15T07:53:38.472797

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))
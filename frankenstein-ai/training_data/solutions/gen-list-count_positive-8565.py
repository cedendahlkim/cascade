# Task: gen-list-count_positive-8565 | Score: 100% | 2026-02-13T21:27:47.250026

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))
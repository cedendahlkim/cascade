# Task: gen-list-count_positive-4602 | Score: 100% | 2026-02-13T19:48:13.643017

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))
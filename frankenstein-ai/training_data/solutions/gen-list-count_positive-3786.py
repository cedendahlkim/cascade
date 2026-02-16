# Task: gen-list-count_positive-3786 | Score: 100% | 2026-02-13T13:42:57.065648

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))
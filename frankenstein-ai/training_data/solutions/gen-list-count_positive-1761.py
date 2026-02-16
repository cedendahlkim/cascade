# Task: gen-list-count_positive-1761 | Score: 100% | 2026-02-13T21:27:57.430451

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))
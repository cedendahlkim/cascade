# Task: gen-list-count_positive-2601 | Score: 100% | 2026-02-15T13:01:17.193910

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))
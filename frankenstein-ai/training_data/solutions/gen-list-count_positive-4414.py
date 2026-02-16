# Task: gen-list-count_positive-4414 | Score: 100% | 2026-02-15T07:53:58.174653

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))
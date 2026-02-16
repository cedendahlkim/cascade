# Task: gen-list-count_positive-7032 | Score: 100% | 2026-02-14T12:04:51.439988

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))
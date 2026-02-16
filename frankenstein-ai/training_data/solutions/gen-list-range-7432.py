# Task: gen-list-range-7432 | Score: 100% | 2026-02-15T12:03:43.081420

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
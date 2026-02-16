# Task: gen-list-range-7615 | Score: 100% | 2026-02-15T10:09:46.503168

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
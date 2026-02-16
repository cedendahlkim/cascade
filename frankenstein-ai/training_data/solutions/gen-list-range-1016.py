# Task: gen-list-range-1016 | Score: 100% | 2026-02-13T21:27:48.366060

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
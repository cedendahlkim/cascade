# Task: gen-list-range-5598 | Score: 100% | 2026-02-13T21:27:59.356793

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
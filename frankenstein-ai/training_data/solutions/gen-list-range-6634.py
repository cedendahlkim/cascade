# Task: gen-list-range-6634 | Score: 100% | 2026-02-15T07:54:00.239106

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
# Task: gen-list-range-9900 | Score: 100% | 2026-02-15T08:36:04.169706

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
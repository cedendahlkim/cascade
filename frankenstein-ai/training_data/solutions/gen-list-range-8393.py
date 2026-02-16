# Task: gen-list-range-8393 | Score: 100% | 2026-02-13T13:10:55.769236

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
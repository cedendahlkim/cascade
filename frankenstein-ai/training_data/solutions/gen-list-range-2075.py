# Task: gen-list-range-2075 | Score: 100% | 2026-02-13T12:04:12.742618

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
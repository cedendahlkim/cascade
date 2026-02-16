# Task: gen-list-range-7096 | Score: 100% | 2026-02-13T12:05:46.020715

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
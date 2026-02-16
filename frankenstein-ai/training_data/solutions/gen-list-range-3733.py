# Task: gen-list-range-3733 | Score: 100% | 2026-02-13T17:11:28.924311

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
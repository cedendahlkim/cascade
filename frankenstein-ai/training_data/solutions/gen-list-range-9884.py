# Task: gen-list-range-9884 | Score: 100% | 2026-02-14T13:11:13.216238

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
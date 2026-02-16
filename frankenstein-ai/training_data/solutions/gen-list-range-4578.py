# Task: gen-list-range-4578 | Score: 100% | 2026-02-15T09:34:50.522708

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
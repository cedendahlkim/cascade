# Task: gen-list-range-5846 | Score: 100% | 2026-02-15T11:13:42.249980

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
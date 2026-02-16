# Task: gen-list-range-9985 | Score: 100% | 2026-02-13T13:09:37.759294

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
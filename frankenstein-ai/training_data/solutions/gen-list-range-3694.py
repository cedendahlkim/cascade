# Task: gen-list-range-3694 | Score: 100% | 2026-02-13T13:10:54.371510

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
# Task: gen-list-range-7821 | Score: 100% | 2026-02-13T18:37:51.469936

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
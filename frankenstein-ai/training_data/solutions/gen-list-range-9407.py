# Task: gen-list-range-9407 | Score: 100% | 2026-02-13T12:44:04.455908

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
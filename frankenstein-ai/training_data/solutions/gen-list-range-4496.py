# Task: gen-list-range-4496 | Score: 100% | 2026-02-14T12:13:40.705007

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
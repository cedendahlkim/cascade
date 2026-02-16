# Task: gen-list-range-5202 | Score: 100% | 2026-02-13T17:36:09.726723

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
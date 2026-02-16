# Task: gen-list-range-5423 | Score: 100% | 2026-02-13T09:34:37.952167

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
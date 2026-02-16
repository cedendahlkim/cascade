# Task: gen-list-range-3813 | Score: 100% | 2026-02-13T14:18:49.250374

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
# Task: gen-list-range-1391 | Score: 100% | 2026-02-13T14:18:58.319159

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
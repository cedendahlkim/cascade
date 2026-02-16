# Task: gen-list-range-5768 | Score: 100% | 2026-02-13T09:28:41.044877

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
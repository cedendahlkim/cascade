# Task: gen-list-range-2315 | Score: 100% | 2026-02-13T14:01:18.083803

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
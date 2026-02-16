# Task: gen-list-range-3193 | Score: 100% | 2026-02-13T11:35:28.821967

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
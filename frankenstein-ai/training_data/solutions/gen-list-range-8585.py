# Task: gen-list-range-8585 | Score: 100% | 2026-02-13T09:15:55.476098

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
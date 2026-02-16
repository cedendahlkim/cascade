# Task: gen-list-range-8681 | Score: 100% | 2026-02-13T17:11:30.163437

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
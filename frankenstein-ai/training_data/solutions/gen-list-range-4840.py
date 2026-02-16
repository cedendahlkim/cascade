# Task: gen-list-range-4840 | Score: 100% | 2026-02-13T20:17:12.635082

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
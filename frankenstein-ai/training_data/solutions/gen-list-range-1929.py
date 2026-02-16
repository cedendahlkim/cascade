# Task: gen-list-range-1929 | Score: 100% | 2026-02-13T18:00:25.458082

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
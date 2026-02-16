# Task: gen-list-range-4954 | Score: 100% | 2026-02-13T18:58:02.598926

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
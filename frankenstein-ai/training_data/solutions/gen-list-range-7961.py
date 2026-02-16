# Task: gen-list-range-7961 | Score: 100% | 2026-02-13T12:05:43.826094

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
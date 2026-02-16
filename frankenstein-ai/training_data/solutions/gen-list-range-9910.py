# Task: gen-list-range-9910 | Score: 100% | 2026-02-13T14:18:46.757012

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
# Task: gen-list-range-3064 | Score: 100% | 2026-02-13T15:28:54.172077

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
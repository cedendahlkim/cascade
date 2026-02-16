# Task: gen-list-range-8503 | Score: 100% | 2026-02-15T08:24:28.547908

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
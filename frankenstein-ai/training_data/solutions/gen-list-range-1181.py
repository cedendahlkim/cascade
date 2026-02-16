# Task: gen-list-range-1181 | Score: 100% | 2026-02-15T09:01:44.029209

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
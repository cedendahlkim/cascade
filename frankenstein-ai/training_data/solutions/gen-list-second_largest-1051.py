# Task: gen-list-second_largest-1051 | Score: 100% | 2026-02-15T09:02:38.265139

n = int(input())
lst = [int(input()) for _ in range(n)]
s = sorted(set(lst))
print(s[-2] if len(s) >= 2 else max(lst))
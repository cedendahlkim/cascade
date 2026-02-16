# Task: gen-list-second_largest-7630 | Score: 100% | 2026-02-15T12:30:08.052440

n = int(input())
lst = [int(input()) for _ in range(n)]
s = sorted(set(lst))
print(s[-2] if len(s) >= 2 else max(lst))
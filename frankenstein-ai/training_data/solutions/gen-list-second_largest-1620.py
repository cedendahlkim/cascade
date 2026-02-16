# Task: gen-list-second_largest-1620 | Score: 100% | 2026-02-13T17:36:11.323890

n = int(input())
lst = [int(input()) for _ in range(n)]
s = sorted(set(lst))
print(s[-2] if len(s) >= 2 else max(lst))
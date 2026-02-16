# Task: gen-list-second_largest-8886 | Score: 100% | 2026-02-15T13:00:19.971930

n = int(input())
lst = [int(input()) for _ in range(n)]
s = sorted(set(lst))
print(s[-2] if len(s) >= 2 else max(lst))
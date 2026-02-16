# Task: gen-list-second_largest-3233 | Score: 100% | 2026-02-15T09:01:51.782652

n = int(input())
lst = [int(input()) for _ in range(n)]
s = sorted(set(lst))
print(s[-2] if len(s) >= 2 else max(lst))
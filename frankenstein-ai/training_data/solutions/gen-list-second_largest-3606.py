# Task: gen-list-second_largest-3606 | Score: 100% | 2026-02-17T20:35:43.628269

n = int(input())
lst = [int(input()) for _ in range(n)]
s = sorted(set(lst))
print(s[-2] if len(s) >= 2 else max(lst))
# Task: gen-list-second_largest-9691 | Score: 100% | 2026-02-15T10:28:30.934757

n = int(input())
lst = [int(input()) for _ in range(n)]
s = sorted(set(lst))
print(s[-2] if len(s) >= 2 else max(lst))
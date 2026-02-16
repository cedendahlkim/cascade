# Task: gen-list-second_largest-5946 | Score: 100% | 2026-02-15T08:14:56.578426

n = int(input())
lst = [int(input()) for _ in range(n)]
s = sorted(set(lst))
print(s[-2] if len(s) >= 2 else max(lst))
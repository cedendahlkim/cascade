# Task: gen-list-second_largest-6489 | Score: 100% | 2026-02-13T19:35:36.542407

n = int(input())
lst = [int(input()) for _ in range(n)]
s = sorted(set(lst))
print(s[-2] if len(s) >= 2 else max(lst))
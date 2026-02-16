# Task: gen-list-second_largest-5062 | Score: 100% | 2026-02-15T08:05:51.504237

n = int(input())
lst = [int(input()) for _ in range(n)]
s = sorted(set(lst))
print(s[-2] if len(s) >= 2 else max(lst))
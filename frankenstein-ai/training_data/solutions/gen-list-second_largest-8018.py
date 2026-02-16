# Task: gen-list-second_largest-8018 | Score: 100% | 2026-02-14T12:04:50.019216

n = int(input())
lst = [int(input()) for _ in range(n)]
s = sorted(set(lst))
print(s[-2] if len(s) >= 2 else max(lst))
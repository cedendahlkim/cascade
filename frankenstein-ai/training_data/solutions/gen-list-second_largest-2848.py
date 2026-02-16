# Task: gen-list-second_largest-2848 | Score: 100% | 2026-02-13T09:15:57.456518

n = int(input())
lst = [int(input()) for _ in range(n)]
s = sorted(set(lst))
print(s[-2] if len(s) >= 2 else max(lst))
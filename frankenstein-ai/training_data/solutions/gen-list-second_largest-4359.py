# Task: gen-list-second_largest-4359 | Score: 100% | 2026-02-13T18:36:01.887169

n = int(input())
lst = [int(input()) for _ in range(n)]
s = sorted(set(lst))
print(s[-2] if len(s) >= 2 else max(lst))
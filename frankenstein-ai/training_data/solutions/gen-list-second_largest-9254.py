# Task: gen-list-second_largest-9254 | Score: 100% | 2026-02-13T11:03:09.935906

n = int(input())
lst = [int(input()) for _ in range(n)]
s = sorted(set(lst))
print(s[-2] if len(s) >= 2 else max(lst))
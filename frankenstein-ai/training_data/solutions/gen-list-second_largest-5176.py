# Task: gen-list-second_largest-5176 | Score: 100% | 2026-02-13T14:01:19.603314

n = int(input())
lst = [int(input()) for _ in range(n)]
s = sorted(set(lst))
print(s[-2] if len(s) >= 2 else max(lst))
# Task: gen-list-second_largest-7208 | Score: 100% | 2026-02-13T16:07:09.585271

n = int(input())
lst = [int(input()) for _ in range(n)]
s = sorted(set(lst))
print(s[-2] if len(s) >= 2 else max(lst))
# Task: gen-list-second_largest-5010 | Score: 100% | 2026-02-13T20:33:05.183889

n = int(input())
lst = [int(input()) for _ in range(n)]
s = sorted(set(lst))
print(s[-2] if len(s) >= 2 else max(lst))
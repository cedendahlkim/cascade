# Task: gen-list-second_largest-5577 | Score: 100% | 2026-02-17T20:11:58.089438

n = int(input())
lst = [int(input()) for _ in range(n)]
s = sorted(set(lst))
print(s[-2] if len(s) >= 2 else max(lst))
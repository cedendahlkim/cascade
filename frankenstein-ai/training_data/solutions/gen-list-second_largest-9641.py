# Task: gen-list-second_largest-9641 | Score: 100% | 2026-02-13T20:50:14.407317

n = int(input())
lst = [int(input()) for _ in range(n)]
s = sorted(set(lst))
print(s[-2] if len(s) >= 2 else max(lst))
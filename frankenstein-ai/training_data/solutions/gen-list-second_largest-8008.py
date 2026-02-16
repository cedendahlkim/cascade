# Task: gen-list-second_largest-8008 | Score: 100% | 2026-02-13T13:42:28.748992

n = int(input())
lst = [int(input()) for _ in range(n)]
s = sorted(set(lst))
print(s[-2] if len(s) >= 2 else max(lst))
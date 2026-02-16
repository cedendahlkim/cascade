# Task: gen-list-second_largest-2557 | Score: 100% | 2026-02-15T07:53:58.787607

n = int(input())
lst = [int(input()) for _ in range(n)]
s = sorted(set(lst))
print(s[-2] if len(s) >= 2 else max(lst))
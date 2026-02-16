# Task: gen-list-second_largest-4635 | Score: 100% | 2026-02-14T12:20:52.234784

n = int(input())
lst = [int(input()) for _ in range(n)]
s = sorted(set(lst))
print(s[-2] if len(s) >= 2 else max(lst))
# Task: gen-list-second_largest-5076 | Score: 100% | 2026-02-13T12:25:56.076801

n = int(input())
lst = [int(input()) for _ in range(n)]
s = sorted(set(lst))
print(s[-2] if len(s) >= 2 else max(lst))
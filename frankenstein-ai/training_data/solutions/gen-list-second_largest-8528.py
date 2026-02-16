# Task: gen-list-second_largest-8528 | Score: 100% | 2026-02-13T18:58:01.465685

n = int(input())
lst = [int(input()) for _ in range(n)]
s = sorted(set(lst))
print(s[-2] if len(s) >= 2 else max(lst))
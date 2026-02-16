# Task: gen-list-second_largest-4975 | Score: 100% | 2026-02-13T18:39:58.691176

n = int(input())
lst = [int(input()) for _ in range(n)]
s = sorted(set(lst))
print(s[-2] if len(s) >= 2 else max(lst))
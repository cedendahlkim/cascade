# Task: gen-list-range-4805 | Score: 100% | 2026-02-13T12:25:56.599175

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
# Task: gen-list-range-6303 | Score: 100% | 2026-02-13T10:01:52.335563

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
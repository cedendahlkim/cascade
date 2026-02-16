# Task: gen-list-range-6355 | Score: 100% | 2026-02-15T07:53:50.161697

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
# Task: gen-list-range-9272 | Score: 100% | 2026-02-13T19:48:20.676794

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
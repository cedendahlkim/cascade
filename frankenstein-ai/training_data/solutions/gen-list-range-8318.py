# Task: gen-list-range-8318 | Score: 100% | 2026-02-13T12:23:19.775317

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
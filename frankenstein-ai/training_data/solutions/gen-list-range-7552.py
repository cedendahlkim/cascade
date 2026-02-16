# Task: gen-list-range-7552 | Score: 100% | 2026-02-13T18:36:11.168205

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
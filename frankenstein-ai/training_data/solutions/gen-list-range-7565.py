# Task: gen-list-range-7565 | Score: 100% | 2026-02-13T13:47:52.566997

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
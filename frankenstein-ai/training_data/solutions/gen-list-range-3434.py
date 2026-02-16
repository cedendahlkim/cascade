# Task: gen-list-range-3434 | Score: 100% | 2026-02-13T13:42:08.955508

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
# Task: gen-list-range-3447 | Score: 100% | 2026-02-15T07:53:39.461979

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
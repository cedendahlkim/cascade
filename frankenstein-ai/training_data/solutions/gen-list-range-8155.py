# Task: gen-list-range-8155 | Score: 100% | 2026-02-13T18:30:01.914498

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
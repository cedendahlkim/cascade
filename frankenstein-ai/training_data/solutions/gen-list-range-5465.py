# Task: gen-list-range-5465 | Score: 100% | 2026-02-13T18:30:04.728793

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))
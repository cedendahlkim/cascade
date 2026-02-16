# Task: gen-sort-insertion_sort-1404 | Score: 100% | 2026-02-14T12:28:29.872009

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
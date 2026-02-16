# Task: gen-sort-bubble_sort-1625 | Score: 100% | 2026-02-13T10:13:34.067790

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
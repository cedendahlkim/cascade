# Task: gen-sort-bubble_sort-1008 | Score: 100% | 2026-02-13T12:13:17.919588

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
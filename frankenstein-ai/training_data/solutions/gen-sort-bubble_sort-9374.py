# Task: gen-sort-bubble_sort-9374 | Score: 100% | 2026-02-13T17:36:40.626628

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
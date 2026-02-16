# Task: gen-sort-bubble_sort-5366 | Score: 100% | 2026-02-15T08:36:12.983403

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
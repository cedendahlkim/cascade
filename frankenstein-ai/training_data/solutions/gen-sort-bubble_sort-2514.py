# Task: gen-sort-bubble_sort-2514 | Score: 100% | 2026-02-15T09:50:59.925310

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
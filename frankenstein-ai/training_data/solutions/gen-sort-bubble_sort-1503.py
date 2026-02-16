# Task: gen-sort-bubble_sort-1503 | Score: 100% | 2026-02-15T08:14:26.888760

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
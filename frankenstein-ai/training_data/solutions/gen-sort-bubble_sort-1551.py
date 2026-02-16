# Task: gen-sort-bubble_sort-1551 | Score: 100% | 2026-02-15T09:16:34.626610

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
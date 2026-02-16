# Task: gen-sort-bubble_sort-6378 | Score: 100% | 2026-02-15T10:51:04.915902

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
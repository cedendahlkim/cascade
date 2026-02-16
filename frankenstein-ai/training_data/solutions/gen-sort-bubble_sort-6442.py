# Task: gen-sort-bubble_sort-6442 | Score: 100% | 2026-02-13T09:51:23.619517

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
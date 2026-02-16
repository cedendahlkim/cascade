# Task: gen-sort-bubble_sort-2599 | Score: 100% | 2026-02-15T09:01:12.443440

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
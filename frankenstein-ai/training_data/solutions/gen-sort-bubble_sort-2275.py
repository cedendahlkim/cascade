# Task: gen-sort-bubble_sort-2275 | Score: 100% | 2026-02-17T20:31:07.213447

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
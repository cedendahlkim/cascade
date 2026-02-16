# Task: gen-sort-bubble_sort-1994 | Score: 100% | 2026-02-14T12:28:42.336011

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
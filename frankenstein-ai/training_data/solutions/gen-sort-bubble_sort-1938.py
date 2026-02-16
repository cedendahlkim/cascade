# Task: gen-sort-bubble_sort-1938 | Score: 100% | 2026-02-13T21:08:28.015829

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
# Task: gen-sort-bubble_sort-1314 | Score: 100% | 2026-02-13T19:05:34.098829

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
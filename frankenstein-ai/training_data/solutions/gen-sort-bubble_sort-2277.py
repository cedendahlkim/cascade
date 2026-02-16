# Task: gen-sort-bubble_sort-2277 | Score: 100% | 2026-02-13T15:46:21.330139

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
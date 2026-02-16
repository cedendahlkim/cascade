# Task: gen-sort-bubble_sort-4209 | Score: 100% | 2026-02-13T19:05:34.856553

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
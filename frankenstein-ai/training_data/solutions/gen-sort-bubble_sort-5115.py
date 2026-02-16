# Task: gen-sort-bubble_sort-5115 | Score: 100% | 2026-02-13T13:11:43.069061

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
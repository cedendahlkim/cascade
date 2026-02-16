# Task: gen-sort-bubble_sort-6722 | Score: 100% | 2026-02-13T13:47:31.128293

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
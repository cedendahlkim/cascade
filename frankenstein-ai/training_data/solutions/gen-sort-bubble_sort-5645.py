# Task: gen-sort-bubble_sort-5645 | Score: 100% | 2026-02-13T12:35:41.353223

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
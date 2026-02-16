# Task: gen-sort-bubble_sort-4075 | Score: 100% | 2026-02-13T19:24:41.234189

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
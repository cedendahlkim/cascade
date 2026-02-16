# Task: gen-sort-bubble_sort-2406 | Score: 100% | 2026-02-13T11:06:27.640540

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
# Task: gen-sort-bubble_sort-5343 | Score: 100% | 2026-02-15T13:01:04.421197

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
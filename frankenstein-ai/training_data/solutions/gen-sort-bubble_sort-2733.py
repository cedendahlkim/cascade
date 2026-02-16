# Task: gen-sort-bubble_sort-2733 | Score: 100% | 2026-02-15T13:59:56.228288

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
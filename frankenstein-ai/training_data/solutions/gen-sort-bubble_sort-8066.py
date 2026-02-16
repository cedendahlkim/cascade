# Task: gen-sort-bubble_sort-8066 | Score: 100% | 2026-02-13T20:50:22.964735

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
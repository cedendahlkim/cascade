# Task: gen-sort-bubble_sort-8632 | Score: 100% | 2026-02-13T13:46:49.537483

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
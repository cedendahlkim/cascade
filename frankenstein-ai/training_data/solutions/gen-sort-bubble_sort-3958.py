# Task: gen-sort-bubble_sort-3958 | Score: 100% | 2026-02-13T19:14:56.547808

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
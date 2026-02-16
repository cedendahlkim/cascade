# Task: gen-sort-bubble_sort-1279 | Score: 100% | 2026-02-15T09:51:02.183906

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
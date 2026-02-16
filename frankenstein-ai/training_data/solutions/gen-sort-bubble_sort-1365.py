# Task: gen-sort-bubble_sort-1365 | Score: 100% | 2026-02-15T12:03:40.957606

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
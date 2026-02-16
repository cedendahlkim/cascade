# Task: gen-sort-bubble_sort-4133 | Score: 100% | 2026-02-15T13:30:49.792705

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
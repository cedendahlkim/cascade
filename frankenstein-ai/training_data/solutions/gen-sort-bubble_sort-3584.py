# Task: gen-sort-bubble_sort-3584 | Score: 100% | 2026-02-15T07:46:49.387355

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
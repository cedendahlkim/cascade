# Task: gen-sort-bubble_sort-1115 | Score: 100% | 2026-02-15T10:50:18.345831

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
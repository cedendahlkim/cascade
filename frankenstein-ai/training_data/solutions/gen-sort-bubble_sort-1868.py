# Task: gen-sort-bubble_sort-1868 | Score: 100% | 2026-02-15T10:09:53.441368

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
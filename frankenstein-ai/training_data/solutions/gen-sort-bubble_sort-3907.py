# Task: gen-sort-bubble_sort-3907 | Score: 100% | 2026-02-13T21:49:33.040347

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
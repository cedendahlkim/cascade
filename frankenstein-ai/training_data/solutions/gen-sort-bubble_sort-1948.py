# Task: gen-sort-bubble_sort-1948 | Score: 100% | 2026-02-13T18:43:48.148950

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
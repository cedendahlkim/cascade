# Task: gen-sort-insertion_sort-3108 | Score: 100% | 2026-02-15T07:53:48.538263

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
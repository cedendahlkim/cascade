# Task: gen-sort-insertion_sort-3686 | Score: 100% | 2026-02-15T07:58:22.596810

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
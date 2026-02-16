# Task: gen-sort-insertion_sort-3435 | Score: 100% | 2026-02-15T09:50:33.994095

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
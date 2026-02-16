# Task: gen-sort-insertion_sort-3776 | Score: 100% | 2026-02-15T08:48:35.766266

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
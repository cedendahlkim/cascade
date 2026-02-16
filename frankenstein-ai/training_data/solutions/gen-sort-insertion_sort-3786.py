# Task: gen-sort-insertion_sort-3786 | Score: 100% | 2026-02-13T17:35:53.810823

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
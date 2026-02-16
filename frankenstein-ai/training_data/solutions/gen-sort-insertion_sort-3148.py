# Task: gen-sort-insertion_sort-3148 | Score: 100% | 2026-02-13T10:14:36.657623

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
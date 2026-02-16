# Task: gen-sort-insertion_sort-3723 | Score: 100% | 2026-02-13T18:57:47.593652

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
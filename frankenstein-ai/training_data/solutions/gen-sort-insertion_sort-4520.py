# Task: gen-sort-insertion_sort-4520 | Score: 100% | 2026-02-13T12:19:10.167991

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
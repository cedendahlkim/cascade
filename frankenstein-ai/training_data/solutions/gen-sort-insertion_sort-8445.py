# Task: gen-sort-insertion_sort-8445 | Score: 100% | 2026-02-14T12:04:37.371371

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
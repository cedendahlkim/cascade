# Task: gen-sort-insertion_sort-3216 | Score: 100% | 2026-02-15T08:14:28.551810

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
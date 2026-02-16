# Task: gen-sort-insertion_sort-4961 | Score: 100% | 2026-02-14T12:08:29.962712

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
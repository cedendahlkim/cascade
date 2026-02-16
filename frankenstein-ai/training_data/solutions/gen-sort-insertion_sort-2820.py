# Task: gen-sort-insertion_sort-2820 | Score: 100% | 2026-02-15T09:17:04.977904

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
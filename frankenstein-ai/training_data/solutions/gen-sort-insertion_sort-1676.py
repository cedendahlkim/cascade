# Task: gen-sort-insertion_sort-1676 | Score: 100% | 2026-02-15T08:05:11.685444

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
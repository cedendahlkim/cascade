# Task: gen-sort-insertion_sort-1991 | Score: 100% | 2026-02-15T10:51:22.025302

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
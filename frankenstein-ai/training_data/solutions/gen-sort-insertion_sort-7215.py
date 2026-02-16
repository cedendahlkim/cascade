# Task: gen-sort-insertion_sort-7215 | Score: 100% | 2026-02-15T08:25:11.816439

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
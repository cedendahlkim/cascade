# Task: gen-sort-insertion_sort-2789 | Score: 100% | 2026-02-15T13:59:55.656555

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
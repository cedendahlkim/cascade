# Task: gen-sort-insertion_sort-2438 | Score: 100% | 2026-02-15T08:06:36.033748

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
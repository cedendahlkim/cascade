# Task: gen-sort-insertion_sort-2619 | Score: 100% | 2026-02-15T10:08:53.980521

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
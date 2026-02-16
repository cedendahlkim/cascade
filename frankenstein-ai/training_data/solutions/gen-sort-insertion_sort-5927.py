# Task: gen-sort-insertion_sort-5927 | Score: 100% | 2026-02-15T10:50:17.233934

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
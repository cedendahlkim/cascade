# Task: gen-sort-insertion_sort-5303 | Score: 100% | 2026-02-15T10:27:55.527128

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
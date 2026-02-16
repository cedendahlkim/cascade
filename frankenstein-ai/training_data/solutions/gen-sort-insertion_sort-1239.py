# Task: gen-sort-insertion_sort-1239 | Score: 100% | 2026-02-15T12:02:40.946056

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
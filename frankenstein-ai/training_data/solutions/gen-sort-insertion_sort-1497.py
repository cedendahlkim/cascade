# Task: gen-sort-insertion_sort-1497 | Score: 100% | 2026-02-14T12:37:02.313722

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
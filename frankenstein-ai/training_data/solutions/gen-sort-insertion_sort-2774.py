# Task: gen-sort-insertion_sort-2774 | Score: 100% | 2026-02-14T13:26:13.712403

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
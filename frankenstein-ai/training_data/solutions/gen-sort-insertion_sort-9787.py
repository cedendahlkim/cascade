# Task: gen-sort-insertion_sort-9787 | Score: 100% | 2026-02-14T12:05:24.371604

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
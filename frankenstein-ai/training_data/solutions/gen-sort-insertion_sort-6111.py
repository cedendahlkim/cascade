# Task: gen-sort-insertion_sort-6111 | Score: 100% | 2026-02-13T09:17:04.382701

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
# Task: gen-sort-insertion_sort-4509 | Score: 100% | 2026-02-13T09:51:16.428781

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
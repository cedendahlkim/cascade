# Task: gen-sort-insertion_sort-1393 | Score: 100% | 2026-02-13T16:47:56.233073

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
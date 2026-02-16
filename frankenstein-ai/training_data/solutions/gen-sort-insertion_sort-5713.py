# Task: gen-sort-insertion_sort-5713 | Score: 100% | 2026-02-13T11:06:28.961748

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
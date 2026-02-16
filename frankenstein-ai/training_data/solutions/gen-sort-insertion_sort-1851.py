# Task: gen-sort-insertion_sort-1851 | Score: 100% | 2026-02-13T19:35:08.878223

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
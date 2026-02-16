# Task: gen-sort-insertion_sort-4293 | Score: 100% | 2026-02-13T15:27:34.147011

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
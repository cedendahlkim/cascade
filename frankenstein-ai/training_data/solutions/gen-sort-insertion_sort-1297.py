# Task: gen-sort-insertion_sort-1297 | Score: 100% | 2026-02-13T15:28:47.626493

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
# Task: gen-sort-insertion_sort-7119 | Score: 100% | 2026-02-13T17:36:30.339274

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
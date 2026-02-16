# Task: gen-sort-insertion_sort-5925 | Score: 100% | 2026-02-13T17:36:01.294826

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
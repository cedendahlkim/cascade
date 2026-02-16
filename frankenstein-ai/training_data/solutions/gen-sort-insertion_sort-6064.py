# Task: gen-sort-insertion_sort-6064 | Score: 100% | 2026-02-13T17:36:36.001511

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
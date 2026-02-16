# Task: gen-sort-insertion_sort-2888 | Score: 100% | 2026-02-13T18:50:27.012798

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
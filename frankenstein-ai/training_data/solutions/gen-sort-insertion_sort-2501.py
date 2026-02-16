# Task: gen-sort-insertion_sort-2501 | Score: 100% | 2026-02-13T18:51:57.289957

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
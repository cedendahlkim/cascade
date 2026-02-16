# Task: gen-sort-insertion_sort-5535 | Score: 100% | 2026-02-13T09:51:24.737672

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
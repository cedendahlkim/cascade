# Task: gen-sort-insertion_sort-1304 | Score: 100% | 2026-02-15T07:53:46.080674

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
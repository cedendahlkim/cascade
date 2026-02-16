# Task: gen-sort-insertion_sort-1737 | Score: 100% | 2026-02-14T12:20:38.100115

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
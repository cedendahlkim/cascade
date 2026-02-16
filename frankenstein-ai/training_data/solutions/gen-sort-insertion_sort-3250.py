# Task: gen-sort-insertion_sort-3250 | Score: 100% | 2026-02-14T12:20:38.932636

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
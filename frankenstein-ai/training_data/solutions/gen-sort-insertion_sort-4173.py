# Task: gen-sort-insertion_sort-4173 | Score: 100% | 2026-02-14T12:08:28.441690

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
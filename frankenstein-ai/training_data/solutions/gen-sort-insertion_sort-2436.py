# Task: gen-sort-insertion_sort-2436 | Score: 100% | 2026-02-13T12:35:39.452280

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
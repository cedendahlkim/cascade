# Task: gen-sort-insertion_sort-5218 | Score: 100% | 2026-02-13T18:43:48.408582

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
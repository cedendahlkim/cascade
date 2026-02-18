# Task: gen-sort-insertion_sort-8143 | Score: 100% | 2026-02-17T20:14:14.212077

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
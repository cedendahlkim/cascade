# Task: gen-sort-insertion_sort-2909 | Score: 100% | 2026-02-17T20:14:20.626117

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
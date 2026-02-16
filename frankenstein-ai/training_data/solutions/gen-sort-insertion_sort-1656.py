# Task: gen-sort-insertion_sort-1656 | Score: 100% | 2026-02-13T21:48:50.499842

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
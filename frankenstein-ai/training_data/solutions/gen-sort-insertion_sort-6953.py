# Task: gen-sort-insertion_sort-6953 | Score: 100% | 2026-02-13T20:01:29.011773

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
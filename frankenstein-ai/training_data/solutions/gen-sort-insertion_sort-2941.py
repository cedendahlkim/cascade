# Task: gen-sort-insertion_sort-2941 | Score: 100% | 2026-02-15T08:05:42.278542

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
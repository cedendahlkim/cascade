# Task: gen-sort-insertion_sort-6486 | Score: 100% | 2026-02-15T08:25:13.225160

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
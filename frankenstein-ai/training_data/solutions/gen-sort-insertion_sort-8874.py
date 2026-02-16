# Task: gen-sort-insertion_sort-8874 | Score: 100% | 2026-02-15T12:02:42.794282

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
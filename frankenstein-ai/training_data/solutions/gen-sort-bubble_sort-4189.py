# Task: gen-sort-bubble_sort-4189 | Score: 100% | 2026-02-15T07:58:34.940531

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
# Task: gen-sort-insertion_sort-5801 | Score: 100% | 2026-02-15T07:53:17.102036

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
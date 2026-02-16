# Task: gen-sort-insertion_sort-1915 | Score: 100% | 2026-02-13T13:42:10.231572

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
# Task: gen-sort-insertion_sort-1743 | Score: 100% | 2026-02-13T12:25:52.434143

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
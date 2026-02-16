# Task: gen-sort-bubble_sort-1081 | Score: 100% | 2026-02-13T12:25:51.199103

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
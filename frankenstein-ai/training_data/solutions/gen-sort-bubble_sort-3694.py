# Task: gen-sort-bubble_sort-3694 | Score: 100% | 2026-02-13T13:46:50.726116

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
# Task: gen-sort-bubble_sort-3478 | Score: 100% | 2026-02-15T09:51:01.091038

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
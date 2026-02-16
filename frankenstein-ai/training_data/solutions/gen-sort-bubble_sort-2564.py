# Task: gen-sort-bubble_sort-2564 | Score: 100% | 2026-02-14T12:08:23.963846

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
# Task: gen-sort-bubble_sort-1209 | Score: 100% | 2026-02-14T12:28:47.009843

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
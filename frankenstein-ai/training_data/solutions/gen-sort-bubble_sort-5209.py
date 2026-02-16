# Task: gen-sort-bubble_sort-5209 | Score: 100% | 2026-02-13T14:42:43.126050

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
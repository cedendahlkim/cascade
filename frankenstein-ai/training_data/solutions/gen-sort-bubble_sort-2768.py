# Task: gen-sort-bubble_sort-2768 | Score: 100% | 2026-02-14T13:40:33.659483

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
# Task: gen-sort-bubble_sort-2751 | Score: 100% | 2026-02-14T12:20:17.716687

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
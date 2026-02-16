# Task: gen-sort-bubble_sort-5070 | Score: 100% | 2026-02-15T08:15:05.405791

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
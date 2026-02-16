# Task: gen-sort-bubble_sort-2624 | Score: 100% | 2026-02-14T12:20:45.753723

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
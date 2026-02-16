# Task: gen-sort-bubble_sort-3871 | Score: 100% | 2026-02-14T12:04:36.717627

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
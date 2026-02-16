# Task: gen-sort-bubble_sort-5885 | Score: 100% | 2026-02-13T10:39:35.103335

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
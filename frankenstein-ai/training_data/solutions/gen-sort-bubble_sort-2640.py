# Task: gen-sort-bubble_sort-2640 | Score: 100% | 2026-02-14T12:37:13.979586

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
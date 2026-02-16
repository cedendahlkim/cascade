# Task: gen-sort-bubble_sort-2117 | Score: 100% | 2026-02-15T08:14:27.253850

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
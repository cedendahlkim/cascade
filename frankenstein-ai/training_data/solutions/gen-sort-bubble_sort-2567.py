# Task: gen-sort-bubble_sort-2567 | Score: 100% | 2026-02-15T07:53:14.122022

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
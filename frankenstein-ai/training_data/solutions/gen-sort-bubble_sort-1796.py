# Task: gen-sort-bubble_sort-1796 | Score: 100% | 2026-02-15T08:47:26.381083

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
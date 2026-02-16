# Task: gen-sort-bubble_sort-1929 | Score: 100% | 2026-02-15T08:05:10.885625

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
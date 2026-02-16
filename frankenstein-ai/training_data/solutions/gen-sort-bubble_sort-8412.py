# Task: gen-sort-bubble_sort-8412 | Score: 100% | 2026-02-15T11:12:42.172157

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
# Task: gen-sort-bubble_sort-6183 | Score: 100% | 2026-02-13T17:36:30.884062

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
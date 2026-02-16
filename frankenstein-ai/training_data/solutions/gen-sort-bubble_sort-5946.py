# Task: gen-sort-bubble_sort-5946 | Score: 100% | 2026-02-13T18:33:52.229149

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
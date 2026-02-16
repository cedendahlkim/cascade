# Task: gen-sort-bubble_sort-4672 | Score: 100% | 2026-02-13T21:08:17.574594

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
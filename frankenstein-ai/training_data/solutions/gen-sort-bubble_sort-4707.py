# Task: gen-sort-bubble_sort-4707 | Score: 100% | 2026-02-13T20:33:09.927378

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
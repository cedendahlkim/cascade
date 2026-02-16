# Task: gen-sort-bubble_sort-4912 | Score: 100% | 2026-02-14T12:20:18.232606

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
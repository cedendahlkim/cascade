# Task: gen-sort-bubble_sort-9189 | Score: 100% | 2026-02-13T13:42:25.155957

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
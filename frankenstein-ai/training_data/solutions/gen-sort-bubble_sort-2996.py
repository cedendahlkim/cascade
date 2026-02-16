# Task: gen-sort-bubble_sort-2996 | Score: 100% | 2026-02-13T12:25:50.395139

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
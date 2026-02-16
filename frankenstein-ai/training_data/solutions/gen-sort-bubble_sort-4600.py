# Task: gen-sort-bubble_sort-4600 | Score: 100% | 2026-02-13T09:13:10.470611

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
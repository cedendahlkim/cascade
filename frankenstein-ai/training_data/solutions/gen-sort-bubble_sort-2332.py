# Task: gen-sort-bubble_sort-2332 | Score: 100% | 2026-02-13T12:42:49.104936

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
# Task: gen-sort-bubble_sort-2180 | Score: 100% | 2026-02-13T16:06:22.714541

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
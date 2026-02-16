# Task: gen-sort-bubble_sort-5809 | Score: 100% | 2026-02-15T08:15:06.653641

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
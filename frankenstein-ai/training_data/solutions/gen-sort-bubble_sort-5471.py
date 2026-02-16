# Task: gen-sort-bubble_sort-5471 | Score: 100% | 2026-02-15T10:27:54.281446

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
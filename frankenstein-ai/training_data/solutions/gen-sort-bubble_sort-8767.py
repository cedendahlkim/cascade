# Task: gen-sort-bubble_sort-8767 | Score: 100% | 2026-02-13T09:52:53.203832

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
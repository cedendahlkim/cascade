# Task: gen-sort-bubble_sort-5520 | Score: 100% | 2026-02-13T18:51:58.059992

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
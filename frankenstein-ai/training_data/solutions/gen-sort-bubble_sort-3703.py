# Task: gen-sort-bubble_sort-3703 | Score: 100% | 2026-02-13T20:01:43.355908

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
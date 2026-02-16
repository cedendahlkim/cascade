# Task: gen-sort-insertion_sort-1416 | Score: 100% | 2026-02-13T19:48:30.635033

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
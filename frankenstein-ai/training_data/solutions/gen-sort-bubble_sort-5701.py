# Task: gen-sort-bubble_sort-5701 | Score: 100% | 2026-02-13T19:35:10.000542

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
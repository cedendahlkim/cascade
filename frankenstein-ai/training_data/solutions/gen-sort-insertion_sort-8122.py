# Task: gen-sort-insertion_sort-8122 | Score: 100% | 2026-02-17T20:00:29.292892

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
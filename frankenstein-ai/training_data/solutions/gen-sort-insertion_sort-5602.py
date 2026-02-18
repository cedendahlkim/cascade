# Task: gen-sort-insertion_sort-5602 | Score: 100% | 2026-02-17T20:31:01.457687

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
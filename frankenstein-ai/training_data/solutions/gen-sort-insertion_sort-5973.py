# Task: gen-sort-insertion_sort-5973 | Score: 100% | 2026-02-13T19:48:12.450147

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
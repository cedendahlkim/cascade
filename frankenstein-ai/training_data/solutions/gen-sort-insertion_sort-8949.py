# Task: gen-sort-insertion_sort-8949 | Score: 100% | 2026-02-13T19:05:35.097167

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
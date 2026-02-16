# Task: gen-sort-insertion_sort-2719 | Score: 100% | 2026-02-13T09:16:58.513222

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
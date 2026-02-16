# Task: gen-sort-insertion_sort-6732 | Score: 100% | 2026-02-13T14:19:26.269163

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
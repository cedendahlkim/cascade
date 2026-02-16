# Task: gen-sort-insertion_sort-8458 | Score: 100% | 2026-02-15T08:14:25.003856

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
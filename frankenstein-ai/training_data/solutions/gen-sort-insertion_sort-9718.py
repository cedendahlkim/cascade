# Task: gen-sort-insertion_sort-9718 | Score: 100% | 2026-02-13T14:30:18.107801

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
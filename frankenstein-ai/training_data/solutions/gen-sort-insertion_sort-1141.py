# Task: gen-sort-insertion_sort-1141 | Score: 100% | 2026-02-14T12:21:05.927615

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
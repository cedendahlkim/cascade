# Task: gen-sort-insertion_sort-1541 | Score: 100% | 2026-02-13T14:30:27.807231

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
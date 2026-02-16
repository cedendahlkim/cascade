# Task: gen-sort-insertion_sort-6007 | Score: 100% | 2026-02-13T18:29:00.982232

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
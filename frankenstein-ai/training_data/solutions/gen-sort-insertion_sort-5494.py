# Task: gen-sort-insertion_sort-5494 | Score: 100% | 2026-02-13T18:40:01.173970

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
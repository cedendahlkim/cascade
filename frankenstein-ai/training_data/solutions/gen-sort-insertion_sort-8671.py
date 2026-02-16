# Task: gen-sort-insertion_sort-8671 | Score: 100% | 2026-02-13T20:50:26.545599

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
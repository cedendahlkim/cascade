# Task: gen-sort-insertion_sort-1627 | Score: 100% | 2026-02-13T21:08:33.076181

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
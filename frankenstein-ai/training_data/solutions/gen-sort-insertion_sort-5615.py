# Task: gen-sort-insertion_sort-5615 | Score: 100% | 2026-02-15T08:35:05.529733

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
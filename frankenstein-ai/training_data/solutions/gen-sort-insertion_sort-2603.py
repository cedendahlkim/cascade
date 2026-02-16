# Task: gen-sort-insertion_sort-2603 | Score: 100% | 2026-02-15T09:16:31.859569

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
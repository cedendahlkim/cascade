# Task: gen-sort-insertion_sort-6052 | Score: 100% | 2026-02-14T12:28:28.415148

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
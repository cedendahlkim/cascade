# Task: gen-sort-insertion_sort-4064 | Score: 100% | 2026-02-13T09:17:08.453807

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
# Task: gen-sort-insertion_sort-9273 | Score: 100% | 2026-02-14T13:41:05.227930

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
# Task: gen-sort-insertion_sort-2945 | Score: 100% | 2026-02-15T09:01:11.279625

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
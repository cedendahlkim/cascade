# Task: gen-sort-bubble_sort-2160 | Score: 100% | 2026-02-14T13:26:06.641502

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
# Task: gen-sort-bubble_sort-6443 | Score: 100% | 2026-02-13T12:26:43.437546

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
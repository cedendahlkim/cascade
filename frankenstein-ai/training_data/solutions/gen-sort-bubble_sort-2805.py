# Task: gen-sort-bubble_sort-2805 | Score: 100% | 2026-02-15T13:01:08.658541

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
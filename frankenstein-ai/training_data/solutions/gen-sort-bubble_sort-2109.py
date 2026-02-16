# Task: gen-sort-bubble_sort-2109 | Score: 100% | 2026-02-14T13:12:15.488060

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
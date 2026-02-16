# Task: gen-sort-bubble_sort-5217 | Score: 100% | 2026-02-14T12:08:30.484971

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
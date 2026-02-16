# Task: gen-sort-bubble_sort-3064 | Score: 100% | 2026-02-13T15:28:04.341347

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
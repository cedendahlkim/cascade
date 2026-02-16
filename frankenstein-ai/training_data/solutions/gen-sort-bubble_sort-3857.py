# Task: gen-sort-bubble_sort-3857 | Score: 100% | 2026-02-15T10:50:17.971316

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
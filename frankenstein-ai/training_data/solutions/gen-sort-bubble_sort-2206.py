# Task: gen-sort-bubble_sort-2206 | Score: 100% | 2026-02-15T10:29:00.513590

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
# Task: gen-sort-bubble_sort-6412 | Score: 100% | 2026-02-13T18:57:46.924167

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
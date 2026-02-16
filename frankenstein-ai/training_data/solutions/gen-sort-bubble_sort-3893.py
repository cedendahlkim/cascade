# Task: gen-sort-bubble_sort-3893 | Score: 100% | 2026-02-13T12:25:50.883467

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
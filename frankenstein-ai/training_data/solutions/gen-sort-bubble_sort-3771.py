# Task: gen-sort-bubble_sort-3771 | Score: 100% | 2026-02-13T19:47:45.844744

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
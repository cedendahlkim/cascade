# Task: gen-sort-bubble_sort-3088 | Score: 100% | 2026-02-13T17:35:53.241151

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
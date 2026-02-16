# Task: gen-sort-bubble_sort-2457 | Score: 100% | 2026-02-13T13:39:00.194582

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))
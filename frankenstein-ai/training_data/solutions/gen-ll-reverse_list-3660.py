# Task: gen-ll-reverse_list-3660 | Score: 100% | 2026-02-13T18:29:32.672810

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
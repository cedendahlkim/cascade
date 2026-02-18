# Task: gen-ll-reverse_list-2327 | Score: 100% | 2026-02-17T20:33:21.937598

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
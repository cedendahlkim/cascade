# Task: gen-ll-reverse_list-6995 | Score: 100% | 2026-02-13T18:20:26.841923

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
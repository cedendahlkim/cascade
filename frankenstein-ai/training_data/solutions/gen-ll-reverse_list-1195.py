# Task: gen-ll-reverse_list-1195 | Score: 100% | 2026-02-13T20:33:24.083439

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
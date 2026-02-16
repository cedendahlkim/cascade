# Task: gen-ll-reverse_list-3519 | Score: 100% | 2026-02-15T08:48:49.264984

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
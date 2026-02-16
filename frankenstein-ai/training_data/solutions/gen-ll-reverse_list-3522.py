# Task: gen-ll-reverse_list-3522 | Score: 100% | 2026-02-13T20:49:45.623108

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
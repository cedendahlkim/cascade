# Task: gen-ll-reverse_list-7598 | Score: 100% | 2026-02-14T12:59:10.174913

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
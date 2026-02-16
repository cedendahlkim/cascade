# Task: gen-ll-reverse_list-4134 | Score: 100% | 2026-02-15T07:49:42.831795

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
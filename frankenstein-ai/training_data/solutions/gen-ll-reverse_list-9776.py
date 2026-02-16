# Task: gen-ll-reverse_list-9776 | Score: 100% | 2026-02-13T20:49:46.841640

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
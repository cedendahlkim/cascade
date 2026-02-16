# Task: gen-ll-reverse_list-7127 | Score: 100% | 2026-02-15T09:34:15.322773

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
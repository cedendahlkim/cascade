# Task: gen-ll-reverse_list-6006 | Score: 100% | 2026-02-13T21:48:45.996031

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
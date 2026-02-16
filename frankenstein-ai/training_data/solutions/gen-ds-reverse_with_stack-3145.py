# Task: gen-ds-reverse_with_stack-3145 | Score: 100% | 2026-02-13T18:51:44.803262

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
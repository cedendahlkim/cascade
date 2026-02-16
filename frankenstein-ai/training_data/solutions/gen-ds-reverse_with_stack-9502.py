# Task: gen-ds-reverse_with_stack-9502 | Score: 100% | 2026-02-15T07:58:34.343276

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
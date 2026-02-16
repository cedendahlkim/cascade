# Task: gen-ds-reverse_with_stack-2003 | Score: 100% | 2026-02-15T12:29:18.847734

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
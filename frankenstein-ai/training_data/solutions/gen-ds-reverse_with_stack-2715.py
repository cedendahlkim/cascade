# Task: gen-ds-reverse_with_stack-2715 | Score: 100% | 2026-02-15T12:03:21.652902

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))